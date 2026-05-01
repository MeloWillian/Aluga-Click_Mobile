package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.GerenteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GerenteRepository extends JpaRepository<GerenteEntity, Long> {
}