package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.MultaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MultaRepository extends JpaRepository<MultaEntity, Long> {
     MultaEntity findByLocacaoId(Long locacaoId);
}