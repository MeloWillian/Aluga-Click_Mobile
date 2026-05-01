package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.PagamentoEntity;
import br.edu.ifpb.alugaclick.repositories.PagamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PagamentoService {

    private final PagamentoRepository pagamentoRepository;

    @Autowired
    public PagamentoService(PagamentoRepository pagamentoRepository) {
        this.pagamentoRepository = pagamentoRepository;
    }

    @Transactional(readOnly = true)
    public List<PagamentoEntity> listarTodos() {
        return pagamentoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<PagamentoEntity> buscarPorId(Long id) {
        return pagamentoRepository.findById(id);
    }

    @Transactional
    public PagamentoEntity salvar(PagamentoEntity pagamento) {
        return pagamentoRepository.save(pagamento);
    }
}