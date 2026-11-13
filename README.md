# ALVERIS
Sistema Integrado de Atendimento e Acompanhamento Hospitalar  
Fábrica de Software · ADS · UNIALFA

## Como executar no Windows

1. Clique com o botão direito em **ALVERIS.zip** e escolha **Extrair Tudo**.
2. Abra a pasta **Alveris-main** e entre em **ALVERIS**.
3. Dê dois cliques em **index.html** para abrir no Edge, Chrome ou Firefox. Mantenha os arquivos na mesma pasta. A aplicação funciona offline, sem instalação.
4. Para repetir a apresentação com exemplos atualizados, entre como **recepcao**, clique em **Restaurar dados de exemplo** e confirme. Isso apaga as alterações da demonstração. Use o mesmo navegador e o mesmo arquivo extraído para reaproveitar os dados locais, quando disponíveis.

## Arquivos

- **index.html** organiza a página e a navegação.
- **style.css** define o visual e adapta a interface a diferentes tamanhos.
- **app.js** mantém os dados compartilhados, renderiza as telas e aplica as regras de agendamento, atendimento e acesso por perfil.

## Roteiro de demonstração

A senha de todas as contas é **alveris**. Clique em **Sair** entre os perfis.

1. **Recepção → Pacientes.** Entre como **recepcao** e cadastre Ana Silva, 28 anos, CPF fictício **000.000.000-00**, telefone **(62) 00000-0000**, Rua Exemplo, 10, SUS. Repita o CPF para demonstrar o bloqueio. Busque Ana pelo nome ou CPF e edite o endereço. Depois busque Bruno e clique em **Ver histórico** para mostrar consultas atendidas e uma cancelada, com seu motivo.
2. **Recepção → Novo agendamento.** Agende Ana com Dr. Carlos Mendes, amanhã às 14h. Tente marcar Bruno com Carlos no mesmo horário e depois tente marcar Ana com Dra. Marina no mesmo horário. Os dois conflitos são bloqueados. Em **Gestão da agenda**, mostre as próximas consultas e os exemplos do mês seguinte.
3. **Recepção → Fila de espera.** Na consulta confirmada de Bruno com Carlos, clique em **Confirmar chegada**. Na fila, mostre a posição e o tempo de espera. Clique em **Chamar / Encaminhar**. Para facilitar o ensaio, é possível registrar a chegada antes da data simulada.
4. **Área Médica → Prontuário.** Entre como **carlos** e inicie o atendimento de Bruno em **Minha fila**. Abra o prontuário e consulte o histórico. Tente finalizar sem preencher o diagnóstico. Em **Atividade da conta**, confira o erro com o nome de Bruno. Volte ao prontuário, preencha o diagnóstico, adicione um item fictício à prescrição e finalize. Confira que o histórico clínico sai da tela ao encerrar a consulta.
5. **Portal do Paciente.** Entre como **bruno**. Em **Meus agendamentos**, confira os próximos horários e os atendimentos anteriores. Em **Minhas prescrições**, pesquise por médico, medicamento ou data, filtre por período e abra **Ver detalhes** para consultar o diagnóstico. Entre como **lia** para demonstrar que cada conta vê seu próprio histórico.
6. **Recepção → Atividade da conta.** Volte como **recepcao** e mostre as entradas, saídas e ações administrativas. Em **Pacientes → Bruno → Ver histórico**, confirme que o atendimento recém-finalizado aparece como **Atendido**.

## Escopo e continuidade

- **Recepção** gerencia pacientes, próximos horários e fila. O histórico administrativo aparece ao selecionar um paciente. Cancelar preserva o registro e o motivo.
- **Área Médica** registra o atendimento e consulta o histórico clínico apenas enquanto estiver atendendo aquele paciente. As prescrições são liberadas no portal após a finalização.
- **Portal do Paciente** exibe dados, agendamentos, histórico e prescrições da própria conta, em modo de leitura.
- **Acesso e armazenamento** são demonstrados no navegador, com dados fictícios e sessão de cinco minutos de inatividade. O protótipo funciona sem servidor ou banco de dados.
