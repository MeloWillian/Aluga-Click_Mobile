package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.ReciboEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReciboRepository extends JpaRepository<ReciboEntity, Long> {
     ReciboEntity findByLocacaoId(Long locacaoId);
}