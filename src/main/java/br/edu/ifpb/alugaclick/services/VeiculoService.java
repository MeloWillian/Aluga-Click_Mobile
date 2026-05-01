package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.VeiculoEntity;
import br.edu.ifpb.alugaclick.repositories.VeiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class VeiculoService {

    private final VeiculoRepository veiculoRepository;

    @Autowired
    public VeiculoService(VeiculoRepository veiculoRepository) {
        this.veiculoRepository = veiculoRepository;
    }

    @Transactional(readOnly = true)
    public List<VeiculoEntity> consultarDisponiveis(LocalDateTime dataInicial, LocalDateTime dataFim, Long categoriaId) {
        return veiculoRepository.findAvailableInPeriodAndCategory(dataInicial, dataFim, categoriaId);
    }

    @Transactional(readOnly = true)
    public List<VeiculoEntity> listarVeiculosPorModelo(String modelo) {
        return veiculoRepository.findByModelo(modelo);
    }

    @Transactional(readOnly = true)
    public List<VeiculoEntity> listarVeiculosPorCategoria(String nomeCategoria) {
        return veiculoRepository.findByCategoriaNome(nomeCategoria);
    }

    @Transactional(readOnly = true)
    public List<VeiculoEntity> listarVeiculosPorStatus(String status) {
        return veiculoRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public Optional<VeiculoEntity> buscarPorId(Long id) {
        return veiculoRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public VeiculoEntity salvar (VeiculoEntity veiculo) {
        return veiculoRepository.save(veiculo);
    }

    @Transactional
    public boolean alterarStatusVeiculo(Long idVeiculo, String novoStatus) {
        if (!("MANUTENCAO".equals(novoStatus) || "DISPONIVEL".equals(novoStatus) || "RETIRADO".equals(novoStatus))) {
            throw new IllegalArgumentException("Status inválido. Status permitido: DISPONIVEL, MANUTENCAO, RETIRADO.");
        }

        Optional<VeiculoEntity> veiculoOpt = veiculoRepository.findById(idVeiculo);
        if (veiculoOpt.isPresent()) {
            VeiculoEntity veiculo = veiculoOpt.get();

            if ("INDISPONIVEL".equals(veiculo.getStatus()) && !("RETIRADO".equals(novoStatus))) {
                throw new IllegalStateException("Não é possível alterar o status de um veículo atualmente locado/reservado.");
            }

            veiculo.setStatus(novoStatus);
            veiculoRepository.save(veiculo);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public List<VeiculoEntity> listarTodosVeiculos() {
        return veiculoRepository.findAll();
    }
}