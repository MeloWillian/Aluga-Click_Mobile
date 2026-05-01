package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.*;
import br.edu.ifpb.alugaclick.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class LocacaoService {

    private final LocacaoRepository locacaoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final MultaRepository multaRepository;
    private final ReciboRepository reciboRepository;
    private final VeiculoRepository veiculoRepository;
    private final GerenciamentoMulta gerenciamentoMulta;

    @Autowired
    public LocacaoService(LocacaoRepository locacaoRepository, PagamentoRepository pagamentoRepository, MultaRepository multaRepository, ReciboRepository reciboRepository, VeiculoRepository veiculoRepository, GerenciamentoMulta gerenciamentoMulta) {
        this.locacaoRepository = locacaoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.multaRepository = multaRepository;
        this.reciboRepository = reciboRepository;
        this.veiculoRepository = veiculoRepository;
        this.gerenciamentoMulta = gerenciamentoMulta;
    }

    @Transactional
    public LocacaoEntity criarNovaLocacao(ReservaEntity reserva, FuncionarioEntity funcionario, String formaPagamento) {
        double valorBase = calcularValorBaseLocacao(reserva, reserva.getTipoCobranca());

        LocacaoEntity locacao = new LocacaoEntity(
                reserva.getTipoCobranca(),
                LocalDateTime.now(),
                reserva.getDataFim(),
                valorBase,
                "ATIVA",
                funcionario,
                reserva
        );

        PagamentoEntity pagamentoInicial = processarPagamentoInicial(locacao, valorBase, formaPagamento);
        locacao.setPagamento(pagamentoInicial);

        locacao.getReserva().getVeiculo().setStatus("INDISPONIVEL");
        veiculoRepository.save(locacao.getReserva().getVeiculo());

        return locacaoRepository.save(locacao);
    }

    private double calcularValorBaseLocacao(ReservaEntity reserva, String tipoCobranca) {
        if ("KM".equalsIgnoreCase(tipoCobranca)) {
            return 0.0;
        }
        long dias = Math.max(1, ChronoUnit.DAYS.between(reserva.getDataInicio().toLocalDate(), reserva.getDataFim().toLocalDate()));
        return dias * reserva.getVeiculo().getValorDiaria();
    }

    @Transactional
    public PagamentoEntity processarPagamentoInicial(LocacaoEntity locacao, double valor, String formaPagamento) {
        PagamentoEntity pagamento = new PagamentoEntity(formaPagamento, valor, LocalDateTime.now(), null);
        return pagamentoRepository.save(pagamento);
    }

    @Transactional
    public ReciboEntity registrarDevolucao(LocacaoEntity locacao, double kmFinal, LocalDateTime dataDevolucao, String formaPagamentoAjuste) {
        PagamentoEntity pagamentoPrincipal = locacao.getPagamento();

        Optional<MultaEntity> multaOpt = gerenciamentoMulta.calcularMultasAtraso(locacao, dataDevolucao, kmFinal);

        if (multaOpt.isPresent()) {
            MultaEntity multa = multaOpt.get();

            multa.setPagamento(pagamentoPrincipal);

            multaRepository.save(multa);

            pagamentoPrincipal.setMulta(multa);
            locacao.setMulta(multa);
        }

        double valorFinalAjuste = calcularValorFinal(locacao, kmFinal, multaOpt, dataDevolucao);

        pagamentoPrincipal.setValor(valorFinalAjuste);
        pagamentoPrincipal.setData(LocalDateTime.now());

        pagamentoRepository.save(pagamentoPrincipal);

        VeiculoEntity veiculo = locacao.getReserva().getVeiculo();
        veiculo.setQuilometragem(kmFinal);
        veiculo.setStatus("DISPONIVEL");
        veiculoRepository.save(veiculo);

        locacao.setDataDevolucaoReal(dataDevolucao);
        locacao.setStatus("FINALIZADA");
        locacao.setValorTotal(valorFinalAjuste);

        locacaoRepository.save(locacao);

        return emitirRecibo(locacao);
    }

    private double calcularCustoRealLocacao(LocacaoEntity locacao, double kmFinal, LocalDateTime dataDevolucao) {
        double valorDiaria = locacao.getReserva().getVeiculo().getValorDiaria();
        double valorKM = locacao.getReserva().getVeiculo().getValorKM();
        double kmRodado = kmFinal - locacao.getReserva().getVeiculo().getQuilometragem();

        if ("DIARIA".equalsIgnoreCase(locacao.getTipoCobranca())) {
            long diasReais = Math.max(1, ChronoUnit.DAYS.between(locacao.getDataInicio().toLocalDate(), dataDevolucao.toLocalDate()));
            return diasReais * valorDiaria;
        } else {
            return kmRodado * valorKM;
        }
    }

    private double calcularValorFinal(LocacaoEntity locacao, double kmFinal, Optional<MultaEntity> multaOpt, LocalDateTime dataDevolucao) {
        double custoReal = calcularCustoRealLocacao(locacao, kmFinal, dataDevolucao);
        if (multaOpt.isPresent()) {
            custoReal += multaOpt.get().getValor();
        }
        return custoReal;
    }

    @Transactional
    public ReciboEntity emitirRecibo(LocacaoEntity locacao) {
        LocacaoEntity locacaoManaged = locacaoRepository.findById(locacao.getId())
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));

        ReciboEntity recibo = new ReciboEntity(
                "REC-" + locacao.getId(),
                LocalDateTime.now(),
                locacaoManaged.getPagamento().getValor(),
                "Referente Locação #" + locacao.getId(),
                locacaoManaged.getPagamento()
        );

        recibo.setLocacao(locacaoManaged);

        ReciboEntity reciboSalvo = reciboRepository.save(recibo);

        locacaoManaged.setRecibo(reciboSalvo);

        locacaoRepository.save(locacaoManaged);

        return reciboSalvo;
    }

    @Transactional(readOnly = true)
    public List<LocacaoEntity> listarTodas() {
        return locacaoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<LocacaoEntity> listarLocacoesPorStatus(String status) {
        return locacaoRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public Optional<LocacaoEntity> buscarPorId(Long id) {
        return locacaoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<LocacaoEntity> listarLocacoesPorCliente(Long idCliente) {
        return locacaoRepository.findByReservaClienteId(idCliente);
    }

    @Transactional(readOnly = true)
    public List<LocacaoEntity> listarLocacoesPorVeiculo(Long idVeiculo) {
        return locacaoRepository.findByReservaVeiculoId(idVeiculo);
    }

    @Transactional(readOnly = true)
    public List<LocacaoEntity> listarLocacoesPorPeriodo(LocalDateTime dataInicio, LocalDateTime dataFim) {
        return locacaoRepository.findByDataInicioBetween(dataInicio, dataFim);
    }
}