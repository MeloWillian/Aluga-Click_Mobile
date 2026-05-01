# 🏠 Aluga-Click

O Aluga Click é um sistema de informatização do processo de locação de veículos, projetado para gerenciar de forma integrada as operações da locadora, o ciclo de vida da frota e o relacionamento com os clientes. A plataforma cobre desde o cadastro detalhado de veículos e clientes até a gestão completa de reservas, locações, devoluções, manutenção e renovação da frota.

Os veículos são organizados por categorias (como Subcompacto, Sedã médio e SUV) e possuem precificação flexível, podendo ser locados por diária ou por quilometragem rodada. O status do veículo é controlado automaticamente, variando entre Disponível, Locado, Em manutenção ou Indicado para venda, de acordo com sua utilização e quilometragem acumulada.

O sistema suporta diferentes perfis de usuários. O Cliente pode realizar autoatendimento, consultando disponibilidade, criando e cancelando reservas, além de participar de um programa de fidelidade baseado na recorrência de locações. O Atendente é responsável por firmar a locação na retirada e concluir o processo na devolução, confirmando dados e permitindo o cálculo automático do valor final. Já o Gerente atua na gestão estratégica, cadastrando veículos e categorias, definindo regras de precificação, limites de quilometragem, perfis de acesso e controlando a manutenção e a retirada de veículos da frota.

Com regras claras de negócio o Aluga Click garante controle operacional, otimização do uso da frota e uma gestão eficiente do relacionamento com os clientes.

---

## 🛠 Pré-requisitos

Para garantir a execução correta dos scripts de automação, seu ambiente deve possuir as seguintes ferramentas instaladas globalmente:

| Ferramenta | Versão Mínima | Motivo |
| :--- | :--- | :--- |
| **Java JDK** | 17 ou superior | Execução do Spring Boot. |
| **Maven** | 3.6+ (Global) | O script utiliza o comando `mvn` no terminal. |
| **Node.js** | 18+ (LTS) | Runtime para o Frontend e scripts de orquestração. |
| **PNPM** | 8+ | Gerenciador de pacotes oficial do projeto. |
| **Docker** | Desktop ou Engine | Containerização do banco de dados PostgreSQL. |

---

## 🚀 Instalação e Execução (Quick Start)

Siga os passos abaixo para configurar o ambiente do zero.

### 1. Clonar o Repositório
```bash
git clone https://github.com/MeloWillian/Aluga-Click.git
cd Aluga-Click 
```

### 2. Setup Inicial (Apenas na 1ª vez)
Execute o comando de configuração. Ele instalará as dependências da raiz e do frontend, além de criar automaticamente o arquivo `.env` necessário.
```bash
pnpm run setup
```

### 3. Iniciar o Ambiente
```bash
pnpm dev
```

Este comando iniciará simultaneamente:

🐘 Banco de Dados (PostgreSQL na porta 5432)

☕ Backend (Spring Boot na porta 8080)

📱 Frontend (Expo na porta 8081)
