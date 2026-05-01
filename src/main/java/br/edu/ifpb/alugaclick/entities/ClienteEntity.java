package br.edu.ifpb.alugaclick.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.Set;
import java.util.HashSet;

@Entity(name = "Cliente")
@Getter
@Setter
@NoArgsConstructor
@Table(name = "cliente")
public class ClienteEntity extends UsuarioEntity {

    @Column(unique = true, length = 14)
    private String cpf;

    @Column(unique = true, length = 11)
    private String cnh;

    private String endereco;

    private String telefone;

    @Column(unique = true)
    private String email;

    private String nivelFidelidade;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<ReservaEntity> listaReservas = new HashSet<>();

    public ClienteEntity(String nome, String login, String senhaHash, PerfilEntity perfil,
                         String cpf, String cnh, String email, String telefone) {
        super(nome, login, senhaHash, perfil);
        this.cpf = cpf;
        this.cnh = cnh;
        this.email = email;
        this.telefone = telefone;
        this.nivelFidelidade = "Bronze";
    }
}