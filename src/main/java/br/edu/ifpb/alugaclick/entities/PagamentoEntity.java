package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity(name = "Pagamento")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "pagamento")
public class PagamentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String formaPagamento;

    @Column(nullable = false)
    private Double valor;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private LocalDateTime data;

    @OneToOne(mappedBy = "pagamento", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("pagamento")
    private MultaEntity multa;

    @OneToOne(mappedBy = "pagamento", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"pagamento", "multa", "recibo", "funcionario", "hibernateLazyInitializer"})
    private LocacaoEntity locacao;


    public PagamentoEntity(String formaPagamento, Double valor, LocalDateTime data, MultaEntity multa) {
        this.formaPagamento = formaPagamento;
        this.valor = valor;
        this.data = data;
        this.multa = multa;
    }
}