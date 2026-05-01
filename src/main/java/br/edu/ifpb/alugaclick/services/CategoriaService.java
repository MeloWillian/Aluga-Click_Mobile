package br.edu.ifpb.alugaclick.services;

import br.edu.ifpb.alugaclick.entities.CategoriaEntity;
import br.edu.ifpb.alugaclick.repositories.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Autowired
    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional
    public CategoriaEntity salvar(CategoriaEntity categoria) {
        return categoriaRepository.save(categoria);
    }

    @Transactional(readOnly = true)
    public Optional<CategoriaEntity> buscarPorNome(String nome) {
        return categoriaRepository.findByNome(nome);
    }

    @Transactional(readOnly = true)
    public List<CategoriaEntity> listarTodas() {
        return categoriaRepository.findAll();
    }

    @Transactional
    public CategoriaEntity atualizar(Long id, CategoriaEntity categoriaDados) {
        return categoriaRepository.findById(id)
                .map(categoriaExistente -> {
                    categoriaExistente.setNome(categoriaDados.getNome());
                    categoriaExistente.setDescricao(categoriaDados.getDescricao());
                    return categoriaRepository.save(categoriaExistente);
                })
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada com id: " + id));
    }

    @Transactional(readOnly = true)
    public Optional<CategoriaEntity> buscarPorId(Long id) {
        return categoriaRepository.findById(id);
    }

    @Transactional
    public void excluir(Long id) {
        if (!categoriaRepository.existsById(id)) {
            throw new RuntimeException("Categoria não encontrada.");
        }
        categoriaRepository.deleteById(id);
    }
}