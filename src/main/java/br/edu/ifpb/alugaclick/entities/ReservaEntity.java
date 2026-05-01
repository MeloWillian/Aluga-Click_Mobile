package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity(name = "Reserva")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "reserva")
public class ReservaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private LocalDateTime dataInicio;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private LocalDateTime dataFim;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, length = 50)
    private String tipoCobranca;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ClienteEntity cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private VeiculoEntity veiculo;

    public ReservaEntity(LocalDateTime dataInicio, LocalDateTime dataFim, String status, ClienteEntity cliente, VeiculoEntity veiculo, String tipoCobranca) {
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.status = status;
        this.cliente = cliente;
        this.veiculo = veiculo;
        this.tipoCobranca = tipoCobranca;
    }
}