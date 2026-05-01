package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.FuncionarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FuncionarioRepository extends JpaRepository<FuncionarioEntity, Long> {
    Optional<FuncionarioEntity> findByMatricula(String matricula);
}