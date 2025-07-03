const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  Events,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', async () => {
  console.log(`Bot está online como ${client.user.tag}`);

  const guild = client.guilds.cache.get('1372349461837123664');
  if (guild) {
    await guild.commands.create({
      name: 'setbutton',
      description: 'Exibe o botão para setar informações',
    });
    await guild.commands.create({
      name: 'setarpagamento',
      description: 'Exibe o botão para abrir uma aba de pagamento',
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isCommand()) {
    if (interaction.commandName === 'setbutton') {
      const button = new ButtonBuilder()
        .setCustomId('open_form')
        .setLabel('Setar Informações')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✍️');
      const row = new ActionRowBuilder().addComponents(button);

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('INICIAR REGISTRO')
        .setDescription('Clique no botão abaixo para preencher suas informações.')
        .setTimestamp()
        .setFooter({ text: '© 2025 Rafael Emerick - Todos os direitos reservados' });

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.commandName === 'setarpagamento') {
      const button = new ButtonBuilder()
        .setCustomId('open_payment')
        .setLabel('Abrir Pagamento')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💸');
      const row = new ActionRowBuilder().addComponents(button);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('ABRIR PAGAMENTO')
        .setDescription('Clique no botão abaixo para abrir sua aba de pagamento.')
        .setTimestamp()
        .setFooter({ text: '© 2025 Rafael Emerick - Todos os direitos reservados' });

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'open_form') {
      const modal = new ModalBuilder()
        .setCustomId('set_user_info')
        .setTitle('Preencha suas informações');

      const nameInput = new TextInputBuilder()
        .setCustomId('user_name')
        .setLabel('Nome na cidade:')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const idInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID:')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const recruitedByInput = new TextInputBuilder()
        .setCustomId('recruited_by')
        .setLabel('Recrutado por:')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
      const desiredRoleInput = new TextInputBuilder()
        .setCustomId('desired_role')
        .setLabel('Cargo desejado:')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(idInput),
        new ActionRowBuilder().addComponents(recruitedByInput),
        new ActionRowBuilder().addComponents(desiredRoleInput),
      );

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'open_payment') {
      const categoryId = '1390128722719543386';
      const guild = interaction.guild;
      const user = interaction.user;
      const channelName = `pagamento-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      const existingChannel = guild.channels.cache.find(
        c => c.name === channelName && c.parentId === categoryId
      );
      if (existingChannel) {
        await interaction.reply({
          content: `Você já possui uma aba de pagamento: <#${existingChannel.id}>`,
          ephemeral: true,
        });
        return;
      }

      try {
        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            {
              id: user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });

        await channel.send(`# 🌙  AJUDA DE CUSTO SEMANAL
Para garantir o bom funcionamento do restaurante e o abastecimento de ingredientes, estabelecemos as seguintes diretrizes:

**VALOR da ajuda de custo:**
Cada colaborador pagará R$ 75.000 por semana, destinados à compra de ingredientes.

**DATA de envio do valor:**
O valor deve ser enviado toda segunda-feira para o passaporte 8082 (Alycia) ou 1002 (Maya)

**COMPRA DIRETA (Opcional):**
Caso prefira, o colaborador pode comprar os ingredientes diretamente no mercado, em vez de enviar o valor.

**COMPROVANTES:**
Todos os comprovantes de pagamento devem ser enviados na aba do membro.
Caso ainda não tenha uma aba, é possível solicitá-la no chat abaixo.

# OBSERVAÇÕES IMPORTANTES:

O valor é **sujeito a alterações** conforme o movimento da semana e despesas internas.

Utilize dos ingredientes com responsabilidade e transparência.

Em caso de dúvidas, procure a @💼 ❯ Gerência 
Vamos manter o estoque sempre cheio e o restaurante funcionando! 

||@everyone @here||`);
        await interaction.reply({
          content: `Sua aba de pagamento foi criada: <#${channel.id}>`,
          ephemeral: true,
        });
      } catch (error) {
        console.error('Erro ao criar canal de pagamento:', error);
        await interaction.reply({
          content: 'Erro ao criar canal. Verifique permissões e categoria.',
          ephemeral: true,
        });
      }
    }

    if (interaction.customId.startsWith('approve_') || interaction.customId.startsWith('reject_')) {
      await interaction.deferUpdate();

      const [action, userId, encodedNick] = interaction.customId.split('_');
      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      const embed = EmbedBuilder.from(interaction.message.embeds[0]);

      if (action === 'approve') {
        const newNick = Buffer.from(encodedNick, 'base64').toString();
        if (member) {
          await member.setNickname(newNick).catch(console.error);
          await member.roles.add('1372349461862285409').catch(console.error);
        }
        embed
          .setColor('#00FF00')
          .setTitle('✅ Solicitação Aprovada')
          .setDescription(`Apelido alterado para **${newNick}**.\nCargo concedido!`);
      } else {
        embed
          .setColor('#FF0000')
          .setTitle('❌ Solicitação Rejeitada')
          .setDescription(`A solicitação de <@${userId}> foi rejeitada.`);
      }

      await interaction.editReply({ embeds: [embed], components: [] });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'set_user_info') {
    const name = interaction.fields.getTextInputValue('user_name');
    const id = interaction.fields.getTextInputValue('user_id');
    const recruitedBy = interaction.fields.getTextInputValue('recruited_by') || 'Não informado';
    const desiredRole = interaction.fields.getTextInputValue('desired_role') || 'Não informado';
    const newNickname = `${name} | ${id}`;

    await interaction.reply({
      content: 'Sua solicitação foi enviada para análise. Aguarde um administrador.',
      ephemeral: true,
    });

    const adminChannelId = '1390083935232462858';
    const adminChannel = interaction.guild.channels.cache.get(adminChannelId);
    if (!adminChannel || !adminChannel.isTextBased()) return;

    const approvalEmbed = new EmbedBuilder()
      .setColor('#FFC107')
      .setTitle('📋 Solicitação de Aprovação')
      .setDescription(`Usuário <@${interaction.user.id}> solicitou mudança de apelido.`)
      .addFields(
        { name: 'Novo Apelido', value: newNickname },
        { name: 'ID Discord', value: interaction.user.id, inline: true },
        { name: 'Recrutado por', value: recruitedBy, inline: true },
        { name: 'Cargo desejado', value: desiredRole },
      )
      .setTimestamp()
      .setFooter({ text: 'Aprovação de Registro', iconURL: client.user.displayAvatarURL() });

    const approvalButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_${interaction.user.id}_${Buffer.from(newNickname).toString('base64')}`)
        .setLabel('✅ Aprovar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reject_${interaction.user.id}_noNick`)
        .setLabel('❌ Rejeitar')
        .setStyle(ButtonStyle.Danger)
    );

    await adminChannel.send({
      content: `🔔 Novo pedido de aprovação de registro:`,
      embeds: [approvalEmbed],
      components: [approvalButtons],
    });
  }
});
