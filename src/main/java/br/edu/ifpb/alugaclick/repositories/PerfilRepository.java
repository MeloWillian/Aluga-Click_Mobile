package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.PerfilEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PerfilRepository extends JpaRepository<PerfilEntity, Long> {
     Optional<PerfilEntity> findByNome(String nome);
}