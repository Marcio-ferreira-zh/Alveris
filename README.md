# ALVERIS — Protótipo do Dia 1

Sistema Integrado de Atendimento e Acompanhamento Hospitalar  
Fábrica de Software · ADS · UNIALFA

## Como executar no Windows

1. Clique com o botão direito em **ALVERIS-.zip** e escolha **Extrair Tudo**.
2. Abra a pasta extraída e entre em **ALVERIS**.
3. Dê dois cliques em **index.html** para abrir no Edge, Chrome ou Firefox. Mantenha os arquivos na mesma pasta. A aplicação funciona offline, sem instalação.
4. Para repetir a apresentação, clique em **Restaurar dados de exemplo** e confirme. Isso apaga as alterações da demonstração. Use o mesmo navegador e o mesmo arquivo extraído para reaproveitar os dados locais, quando o navegador permitir.

## Arquivos

- **index.html** organiza a página e a navegação.
- **style.css** define o visual e adapta a interface a diferentes tamanhos.
- **app.js** mantém os dados compartilhados, renderiza as telas e aplica as regras dos cinco cards.

## Roteiro de demonstração 

1. **Recepção → Pacientes.** Cadastre Ana Silva, 28 anos, CPF fictício `000.000.000-00`, telefone `(62) 00000-0000`, Rua Exemplo, 10, SUS. Repita o cadastro com o mesmo CPF para mostrar o bloqueio. Busque Ana pelo nome ou CPF e use **Editar** para mudar o endereço.
2. **Recepção → Agendamentos.** Selecione Ana, Dr. Carlos Mendes, a data padrão (amanhã) e 14h. Clique em **Revisar e agendar** e confirme os dados. O status aparece como **Agendado**. Tente marcar Bruno com o mesmo médico, data e horário para demonstrar o conflito.
3. **Portal do Paciente → Agendamentos.** Selecione Ana e confira a consulta. Em **Meus dados**, confira o endereço atualizado. Em **Agendamentos**, selecione Rui para mostrar o aviso de agenda vazia.
4. **Recepção → Agendamentos.** Na linha de Ana, clique em **Confirmar agendamento** e depois em **Confirmar chegada**. Na fila, mostre posição, médico, horário e tempo de espera. Clique em **Chamar / Encaminhar**. A ação passa a mostrar **Encaminhado**. Para facilitar o ensaio, a chegada simulada pode ser registrada antes do dia marcado.
5. **Painel Médico.** Alterne entre Dra. Marina e Dr. Carlos para mostrar a separação das filas. Com Dr. Carlos, clique em **Iniciar atendimento** na linha de Ana. Confira nome, idade e cobertura no painel. Volte à Recepção e mostre **Em Atendimento** na fila. Cada médico pode ter um único atendimento ativo.

## Escopo e continuidade

- Dia 1 · Cadastro, agendamento, portal de consulta, fila e início do atendimento.
- Dia 2 · Prontuário, histórico, prescrição, finalização e manutenção da agenda. O atendimento iniciado no Dia 1 já fica vinculado ao agendamento para a próxima etapa.
- Dia 3 · Perfis, prescrições no portal e demais cards após receber os critérios completos.
