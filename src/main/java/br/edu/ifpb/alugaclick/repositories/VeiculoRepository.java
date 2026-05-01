package br.edu.ifpb.alugaclick.repositories;

import br.edu.ifpb.alugaclick.entities.VeiculoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VeiculoRepository extends JpaRepository<VeiculoEntity, Long> {
    List<VeiculoEntity> findByModelo(String modelo);

    List<VeiculoEntity> findByCategoriaNome(String categoriaNome);

    List<VeiculoEntity> findByStatus(String status);

    @Query("SELECT v FROM Veiculo v " +
            "WHERE v.categoria.id = :categoriaId " +
            "AND v.status = 'DISPONIVEL' " +
            "AND v.id NOT IN (" +
            "SELECT r.veiculo.id FROM Reserva r " +
            "WHERE r.status IN ('CONFIRMADA', 'PENDENTE') " +
            "AND (" +
            "(r.dataInicio <= :dataFim AND r.dataFim >= :dataInicio)" +
            ")" +
            ")")
    List<VeiculoEntity> findAvailableInPeriodAndCategory(
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            @Param("categoriaId") Long categoriaId
    );
}