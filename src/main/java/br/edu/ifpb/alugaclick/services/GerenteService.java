package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class GerenteService {

    private final PerfilService perfilService;
    private final UsuarioService usuarioService;
    private final VeiculoService veiculoService;
    private final CategoriaService categoriaService;

    @Autowired
    public GerenteService(PerfilService perfilService,
                          UsuarioService usuarioService,
                          VeiculoService veiculoService,
                          CategoriaService categoriaService) {
        this.perfilService = perfilService;
        this.usuarioService = usuarioService;
        this.veiculoService = veiculoService;
        this.categoriaService = categoriaService;
    }
    @Transactional
    public PerfilEntity criarPerfil(PerfilEntity perfil) {
        return perfilService.salvar(perfil);
    }

    @Transactional(readOnly = true)
    public List<PerfilEntity> listaPerfis() {
        return perfilService.listarTodos();
    }

    @Transactional
    public UsuarioEntity criarUsuario(UsuarioEntity usuario) {
        if (usuario.getPerfil() != null && usuario.getPerfil().getId() != null) {
            PerfilEntity perfilBanco = perfilService.buscarPorId(usuario.getPerfil().getId())
                    .orElseThrow(() -> new RuntimeException("Perfil informado não existe."));
            usuario.setPerfil(perfilBanco);
        }
        return usuarioService.salvarUsuario(usuario);
    }

    @Transactional
    public VeiculoEntity incluirNovoVeiculo(VeiculoEntity veiculo) {
        if (veiculo.getCategoria() != null && veiculo.getCategoria().getId() != null) {
            CategoriaEntity categoriaBanco = categoriaService.buscarPorId(veiculo.getCategoria().getId())
                    .orElseThrow(() -> new RuntimeException("Categoria não encontrada."));

            veiculo.setCategoria(categoriaBanco);
        }

        return veiculoService.salvar(veiculo);
    }

    @Transactional
    public boolean retirarVeiculoDaFrota(Long idVeiculo) {
        Optional<VeiculoEntity> veiculoOpt = veiculoService.buscarPorId(idVeiculo);
        if (veiculoOpt.isPresent()) {
            VeiculoEntity veiculo = veiculoOpt.get();
            veiculo.setStatus("RETIRADO");
            veiculoService.salvar(veiculo);
            return true;
        }
        return false;
    }

    @Transactional
    public UsuarioEntity atualizarParcial(Long id, UsuarioEntity dadosNovos) {
        UsuarioEntity usuarioExistente = usuarioService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (dadosNovos.getNome() != null && !dadosNovos.getNome().isEmpty()) {
            usuarioExistente.setNome(dadosNovos.getNome());
        }

        if (dadosNovos.getLogin() != null && !dadosNovos.getLogin().isEmpty()) {
            usuarioExistente.setLogin(dadosNovos.getLogin());
        }

        if (dadosNovos.getSenhaHash() != null && !dadosNovos.getSenhaHash().isEmpty()) {
            usuarioExistente.setSenhaHash(dadosNovos.getSenhaHash());
        }

        if (dadosNovos.getPerfil() != null && dadosNovos.getPerfil().getId() != null) {
            PerfilEntity novoPerfil = perfilService.buscarPorId(dadosNovos.getPerfil().getId())
                    .orElseThrow(() -> new RuntimeException("Perfil não encontrado"));

            usuarioExistente.setPerfil(novoPerfil);
        }

        if (usuarioExistente instanceof FuncionarioEntity && dadosNovos instanceof FuncionarioEntity) {
            String novaMatricula = ((FuncionarioEntity) dadosNovos).getMatricula();
            if (novaMatricula != null && !novaMatricula.isEmpty()) {
                ((FuncionarioEntity) usuarioExistente).setMatricula(novaMatricula);
            }
        }

        return usuarioService.salvarUsuario(usuarioExistente);
    }
}