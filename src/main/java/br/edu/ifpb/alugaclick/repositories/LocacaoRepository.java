package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.ClienteEntity;
import br.edu.ifpb.alugaclick.entities.LocacaoEntity;
import br.edu.ifpb.alugaclick.entities.VeiculoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LocacaoRepository extends JpaRepository<LocacaoEntity, Long> {
    List<LocacaoEntity> findByStatus(String status);

    List<LocacaoEntity> findByDataInicioBetween(LocalDateTime dataInicio, LocalDateTime dataFim);

    List<LocacaoEntity> findByReservaClienteId(Long idCliente);

    List<LocacaoEntity> findByReservaVeiculoId(Long idVeiculo);
}