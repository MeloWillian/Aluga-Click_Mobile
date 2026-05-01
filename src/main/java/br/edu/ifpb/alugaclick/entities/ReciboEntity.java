package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity(name = "Recibo")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "recibo")
public class ReciboEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String numero;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private LocalDateTime dataEmissao;

    @Column(nullable = false)
    private Double valorTotal;

    @Column(length = 500)
    private String detalhes;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pagamento_id", unique = true, nullable = false)
    @JsonIgnoreProperties({"recibo", "locacao", "multa"})
    private PagamentoEntity pagamento;

    @OneToOne(mappedBy = "recibo", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"recibo", "pagamento", "multa", "funcionario", "hibernateLazyInitializer"})
    private LocacaoEntity locacao;

    public ReciboEntity(String numero, LocalDateTime dataEmissao, Double valorTotal, String detalhes, PagamentoEntity pagamento) {
        this.numero = numero;
        this.dataEmissao = dataEmissao;
        this.valorTotal = valorTotal;
        this.detalhes = detalhes;
        this.pagamento = pagamento;
    }
}