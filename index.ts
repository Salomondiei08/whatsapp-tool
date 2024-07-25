import { Client, GroupParticipant, GroupChat, LocalAuth, MessageTypes } from "whatsapp-web.js";
import fs from 'fs';

const client = new Client({ authStrategy: new LocalAuth() });

// Function to determine if the phone number is from a French-speaking country
function isFrenchSpeakingCountry(phoneNumber) {
  const frenchSpeakingCountryCodes = [
    '33', '32', '41', '352', '377', '225', '221', '237',
    '226', '223', '227', '235', '224', '229', '257', '228',
    '236', '242', '243', '241', '253', '269', '261', '250',
    '248', '678', '509'
  ];
  return frenchSpeakingCountryCodes.some(code => phoneNumber.startsWith(code));
}

function printMessageText(message) {
  if (message.body) { // Check if the message has text content
    console.log(`Message text: ${message.body}`);
  } else {
    console.log(`Message with ID ${message.id._serialized} does not contain text.`);
  }
}

function saveNumber(participantId) {
  fs.appendFileSync('text.txt', participantId + '\n');
}

async function sendMessage(participantId) {
  const phoneNumber = participantId.split('@')[0];

  // Determine the message based on the phone number
  let message;
  if (isFrenchSpeakingCountry(phoneNumber)) {
    message = `👋🏽 Hello, ici *Heart*, le robot jardinier de la communauté Tech Republic, j’espère que tu vas bien.

Je t’écris car nous procédons à une mise à jour des membres de la communauté.
—-
Peux-tu stp répondre à ce message en précisant les informations suivantes :
👤 Ton nom et prénom
🤖 Ton rôle
💼 La compagnie dans laquelle tu travailles
🌍 Ton pays de résidence
      
—-
⚠️ Toute personne qui ne répondra pas à ce message d’ici le 28 juillet 2024 sera automatiquement retirée de la communauté.
      
Merci et à bientôt 🫶🏽`;
  } else {
    message = `👋🏽 Hello, this is *Heart*, Tech Republic’s bot, I hope you are doing well.

I am reaching out because we are updating our members list.
—-
Could you please respond to this message with the following information:
👤 Your first and last name
🤖 Your role
💼 The company you work for
🌍 Your country of residence
      
—-
⚠️ Anyone who does not respond to this message by July 28th, 2024, will be automatically removed from the community.
      
Thank you and see you soon 🫶🏽`;
  }

  // Send the message and store the sent message object
  try {
    const sentMessage = await client.sendMessage(participantId, message);
    console.log(`Message sent to: ${participantId}`);
    return sentMessage;
  } catch (error) {
    console.error(`Failed to send message to ${participantId}:`, error);
    return null;
  }
}

async function getParticipants() {
  console.log("Client is ready!");
  try {
    const chat = await client.getChatById("120363043790757321@g.us");
    if (!chat.isGroup) {
      throw new Error("The specified chat is not a group chat");
    }

    let gr = chat as GroupChat;
    const participants = gr.participants;

    for (const part of participants) {
      const partId = part.id._serialized;

      // Save the participant ID
      saveNumber(partId);
      const sentMessage = await sendMessage(partId);

    }
  } catch (error) {
    console.error("Error getting participants or sending messages:", error);
  }
}


async function deleteLastMessageInEachChat() {
  console.log("Client is ready!");
  try {
    const chats = await client.getChats();
    for (const chat of chats) {
      if (!chat.isGroup) { // Only proceed if it's not a group chat
        const messages = await chat.fetchMessages({ limit: 1 }); // Fetch the most recent message
        if (messages.length > 0) {
          const lastMessage = messages[0];
          printMessageText(lastMessage); // Print only the text of the message

          if (lastMessage.fromMe) { // Check if the message was sent by the bot
            await deleteMessage(lastMessage);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching chats or deleting messages:", error);
  }
}


async function deleteMessage(message) {
  try {
    // The delete method should be called on the message object
    await message.delete(true); // true indicates delete for everyone
    console.log(`Message deleted: ${message.id._serialized}`);
  } catch (error) {
    console.error(`Failed to delete message: ${message.id._serialized}`, error);
  }
}


client.on("ready", deleteLastMessageInEachChat);
client.initialize();
