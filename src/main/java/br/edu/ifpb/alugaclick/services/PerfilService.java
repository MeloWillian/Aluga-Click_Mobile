package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.PerfilEntity;
import br.edu.ifpb.alugaclick.repositories.PerfilRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PerfilService {

    private final PerfilRepository perfilRepository;

    @Autowired
    public PerfilService(PerfilRepository perfilRepository) {
        this.perfilRepository = perfilRepository;
    }

    @Transactional
    public PerfilEntity salvar(PerfilEntity perfil) {
        return perfilRepository.save(perfil);
    }

    @Transactional
    public void deletar(Long id) {
        perfilRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Optional<PerfilEntity> buscarPorId(Long id) {
        return perfilRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<PerfilEntity> listarTodos() {
        return perfilRepository.findAll();
    }

    @Transactional
    public PerfilEntity atualizarPermissoes(PerfilEntity perfil) {
        return perfilRepository.save(perfil);
    }
}