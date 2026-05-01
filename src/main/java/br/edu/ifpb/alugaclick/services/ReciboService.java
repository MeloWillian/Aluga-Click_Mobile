package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.ReciboEntity;
import br.edu.ifpb.alugaclick.repositories.ReciboRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ReciboService {

    private final ReciboRepository reciboRepository;

    @Autowired
    public ReciboService(ReciboRepository reciboRepository) {
        this.reciboRepository = reciboRepository;
    }

    @Transactional(readOnly = true)
    public List<ReciboEntity> listarTodos() {
        return reciboRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<ReciboEntity> buscarPorId(Long id) {
        return reciboRepository.findById(id);
    }
}