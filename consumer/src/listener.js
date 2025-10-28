const amqp = require("amqplib");
const PlaylistsService = require("./PlaylistsService");
const MailSender = require("./MailSender");
const config = require("./config");

const init = async () => {
  const playlistsService = new PlaylistsService();
  const mailSender = new MailSender();

  const connection = await amqp.connect(config.rabbitMq.server);
  const channel = await connection.createChannel();

  await channel.assertQueue("export:playlists", {
    durable: true,
  });

  channel.consume("export:playlists", async (message) => {
    try {
      const { playlistId, targetEmail } = JSON.parse(
        message.content.toString()
      );

      console.log(`Processing export for playlist: ${playlistId}`);
      console.log(`Target email: ${targetEmail}`);

      const playlist = await playlistsService.getPlaylistById(playlistId);
      const playlistJson = JSON.stringify(playlist);

      await mailSender.sendEmail(targetEmail, playlistJson);

      console.log(`Export sent successfully to ${targetEmail}`);
      channel.ack(message);
    } catch (error) {
      console.error("Error processing message:", error);
      channel.ack(message);
    }
  });
};

init();
