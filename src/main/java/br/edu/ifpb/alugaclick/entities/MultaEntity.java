package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity(name = "Multa")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "multa")
public class MultaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String motivo;

    @Column(nullable = false)
    private Double valor;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private LocalDateTime data;

    @OneToOne(mappedBy = "multa", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"multa", "pagamento", "recibo", "hibernateLazyInitializer", "handler"})
    private LocacaoEntity locacao;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "pagamento_id", unique = true, nullable = true)
    @JsonIgnoreProperties({"multa", "locacao", "hibernateLazyInitializer", "handler"})
    private PagamentoEntity pagamento;

    public MultaEntity(String motivo, Double valor, LocalDateTime data) {
        this.motivo = motivo;
        this.valor = valor;
        this.data = data;
    }
}