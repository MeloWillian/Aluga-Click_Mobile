package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.Set;
import java.util.HashSet;

@Entity(name = "Veiculo")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "veiculo")
public class VeiculoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 10)
    private String placa;

    @Column(nullable = false, length = 50)
    private String modelo;

    @Column(nullable = false, length = 50)
    private String marca;

    @Column(nullable = false)
    private Integer ano;

    @Column(length = 30)
    private String cor;

    @Column(nullable = false)
    private Double quilometragem;

    @Column(nullable = false)
    private Double valorDiaria;

    private Double valorKM;

    @Column(nullable = false, length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "veiculos"}) 
    private CategoriaEntity categoria;

    @OneToMany(mappedBy = "veiculo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<ReservaEntity> listaReservas = new HashSet<>();

    public VeiculoEntity(String placa, String modelo, String marca, Integer ano, String cor,
                         Double quilometragem, Double valorDiaria, Double valorKM, String status, CategoriaEntity categoria) {
        this.placa = placa;
        this.modelo = modelo;
        this.marca = marca;
        this.ano = ano;
        this.cor = cor;
        this.quilometragem = quilometragem;
        this.valorDiaria = valorDiaria;
        this.valorKM = valorKM;
        this.status = status;
        this.categoria = categoria;
    }
}