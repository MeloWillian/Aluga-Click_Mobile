package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity(name = "Usuario")
@Inheritance(strategy = InheritanceType.JOINED)
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "tipoUsuario"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = FuncionarioEntity.class, name = "FUNCIONARIO"),
        @JsonSubTypes.Type(value = GerenteEntity.class, name = "GERENTE"),
        @JsonSubTypes.Type(value = ClienteEntity.class, name = "CLIENTE")
})
@Getter
@Setter
@NoArgsConstructor
public abstract class UsuarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String login;

    @Column(nullable = false)
    private String senhaHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfil_id", nullable = false)
    private PerfilEntity perfil;

    public UsuarioEntity(String nome, String login, String senhaHash, PerfilEntity perfil) {
        this.nome = nome;
        this.login = login;
        this.senhaHash = senhaHash;
        this.perfil = perfil;
    }
}