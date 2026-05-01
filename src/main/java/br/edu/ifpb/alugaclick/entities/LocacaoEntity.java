package br.edu.ifpb.alugaclick.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity(name = "Locacao")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "locacao")
public class LocacaoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String tipoCobranca;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private LocalDateTime dataInicio;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private LocalDateTime previsaoDevolucao;

    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime dataDevolucaoReal;

    @Column(nullable = false)
    private Double valorTotal;

    @Column(nullable = false, length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private FuncionarioEntity funcionario;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", unique = true, nullable = false)
    private ReservaEntity reserva;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "pagamento_id", unique = true, nullable = true)
    private PagamentoEntity pagamento;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "multa_id", unique = true, nullable = true)
    private MultaEntity multa;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "recibo_id", unique = true, nullable = true)
    private ReciboEntity recibo;

    public LocacaoEntity(String tipoCobranca, LocalDateTime dataInicio, LocalDateTime previsaoDevolucao, Double valorTotal, String status, FuncionarioEntity funcionario, ReservaEntity reserva) {
        this.tipoCobranca = tipoCobranca;
        this.dataInicio = dataInicio;
        this.previsaoDevolucao = previsaoDevolucao;
        this.valorTotal = valorTotal;
        this.status = status;
        this.funcionario = funcionario;
        this.reserva = reserva;
    }
}