package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.Set;
import java.util.HashSet;

@Entity(name = "Categoria")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "categoria")
public class CategoriaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String nome;

    @Column(length = 255)
    private String descricao;

    @OneToMany(mappedBy = "categoria", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("categoria")
    private Set<VeiculoEntity> veiculos = new HashSet<>();

    public CategoriaEntity(String nome, String descricao) {
        this.nome = nome;
        this.descricao = descricao;
    }
}