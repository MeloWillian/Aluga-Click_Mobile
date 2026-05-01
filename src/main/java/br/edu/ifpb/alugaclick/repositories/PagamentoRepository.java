package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.PagamentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PagamentoRepository extends JpaRepository<PagamentoEntity, Long> {
     PagamentoEntity findByLocacaoId(Long locacaoId);
}