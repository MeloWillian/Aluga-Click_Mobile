package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.UsuarioEntity;
import br.edu.ifpb.alugaclick.repositories.UsuarioRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UsuarioService {

    final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioEntity salvarUsuario(UsuarioEntity usuario) {
        if (usuario.getSenhaHash() != null) {
            usuario.setSenhaHash(passwordEncoder.encode(usuario.getSenhaHash()));
        }
        return usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public boolean logar(String login, String senha) {
        Optional<UsuarioEntity> usuarioOpt = usuarioRepository.findByLogin(login);

        return usuarioOpt.isPresent() && passwordEncoder.matches(senha, usuarioOpt.get().getSenhaHash());
    }

    @Transactional
    public void excluirPorId(Long id) {
        usuarioRepository.deleteById(id);
    }

    public List<UsuarioEntity> listarTodosUsuarios() {
        return usuarioRepository.findAll();
    }

    public Optional<UsuarioEntity> buscarPorId(Long idUsuario) {
        return usuarioRepository.findById(idUsuario);
    }

    @Transactional(readOnly = true)
    public Optional<UsuarioEntity> buscarPorLogin(String login) {
        return usuarioRepository.findByLogin(login);
    }
}