package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.FuncionarioEntity;
import br.edu.ifpb.alugaclick.repositories.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;

    @Autowired
    public FuncionarioService(FuncionarioRepository funcionarioRepository) {
        this.funcionarioRepository = funcionarioRepository;
    }

    @Transactional
    public FuncionarioEntity salvarFuncionario(FuncionarioEntity funcionario) {
        return funcionarioRepository.save(funcionario);
    }

    @Transactional(readOnly = true)
    public Optional<FuncionarioEntity> buscarPorMatricula(String matricula) {
        return funcionarioRepository.findByMatricula(matricula);
    }

    @Transactional(readOnly = true)
    public Optional<FuncionarioEntity> buscarPorId(Long id) {
        return funcionarioRepository.findById(id);
    }

}