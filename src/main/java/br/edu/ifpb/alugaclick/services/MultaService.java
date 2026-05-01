package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.MultaEntity;
import br.edu.ifpb.alugaclick.repositories.MultaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MultaService {

    private final MultaRepository multaRepository;

    @Autowired
    public MultaService(MultaRepository multaRepository) {
        this.multaRepository = multaRepository;
    }

    @Transactional(readOnly = true)
    public List<MultaEntity> listarTodas() {
        return multaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<MultaEntity> buscarPorId(Long id) {
        return multaRepository.findById(id);
    }

    @Transactional
    public MultaEntity salvar(MultaEntity multa) {
        return multaRepository.save(multa);
    }
}