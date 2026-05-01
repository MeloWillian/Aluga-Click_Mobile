package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.LocacaoEntity;
import br.edu.ifpb.alugaclick.entities.MultaEntity;
import br.edu.ifpb.alugaclick.repositories.LocacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class GerenciamentoMulta {

    private static final double FATOR_MULTA_DIARIA = 0.5;
    private static final double FATOR_MULTA_KM = 0.25;

    private final LocacaoRepository locacaoRepository;

    @Autowired
    public GerenciamentoMulta(LocacaoRepository locacaoRepository) {
        this.locacaoRepository = locacaoRepository;
    }

    @Transactional(readOnly = true)
    public Optional<LocacaoEntity> identificarLocacaoAtrasada(Long idLocacao) {
        Optional<LocacaoEntity> locacaoOpt = locacaoRepository.findById(idLocacao);

        if (locacaoOpt.isPresent()) {
            LocacaoEntity locacao = locacaoOpt.get();
            if (locacao.getPrevisaoDevolucao().isBefore(LocalDateTime.now()) && locacao.getStatus().equals("ATIVA")) {
                return locacaoOpt;
            }
        }
        return Optional.empty();
    }

    public Optional<MultaEntity> calcularMultasAtraso(LocacaoEntity locacao, LocalDateTime dataDevolucao, double kmFinal) {
        double valorMultaTotal = 0.0;
        String motivo = "";


        if(dataDevolucao.isAfter(locacao.getPrevisaoDevolucao())){
            long diasAtraso = ChronoUnit.DAYS.between(locacao.getPrevisaoDevolucao().toLocalDate(), dataDevolucao.toLocalDate());
            motivo += "Atraso de " + diasAtraso + " dia(s). ";

            if(locacao.getReserva().getTipoCobranca().equals("DIARIA")){
                double valorDiaria = locacao.getReserva().getVeiculo().getValorDiaria();
                double multaAtraso = diasAtraso * valorDiaria * FATOR_MULTA_DIARIA;

                valorMultaTotal += multaAtraso;
            }else {
                double kmRodado = kmFinal - locacao.getReserva().getVeiculo().getQuilometragem();
                double valorKM = locacao.getReserva().getVeiculo().getValorKM();

                valorMultaTotal = (kmRodado * valorKM) * FATOR_MULTA_KM;
                motivo += "Multa por atraso na entrega em plano de KM (sobre KM total).";
            }
        }

        if (valorMultaTotal > 0.0) {
            MultaEntity multa = new MultaEntity(motivo.trim(), valorMultaTotal, LocalDateTime.now());
            return Optional.of(multa);
        }

        return Optional.empty();
    }
}