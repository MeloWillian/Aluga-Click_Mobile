package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.ClienteEntity;
import br.edu.ifpb.alugaclick.entities.ReservaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<ReservaEntity, Long> {
    @Query("SELECT r FROM Reserva r JOIN FETCH r.cliente JOIN FETCH r.veiculo WHERE r.id = :id")
    Optional<ReservaEntity> findById(@Param("id") Long id);

    @Query("SELECT r FROM Reserva r JOIN FETCH r.cliente JOIN FETCH r.veiculo")
    List<ReservaEntity> findAll();

    List<ReservaEntity> findByStatus(String status);

    List<ReservaEntity> findByCliente(ClienteEntity cliente);

    List<ReservaEntity> findByDataInicioBetween(LocalDateTime inicio, LocalDateTime fim);

    List<ReservaEntity> findByClienteAndDataInicioBetween(ClienteEntity cliente, LocalDateTime dataInicio, LocalDateTime dataFim);

    List<ReservaEntity> findByClienteAndStatus(ClienteEntity cliente, String status);

    List<ReservaEntity> findByClienteId(Long clienteId);
}