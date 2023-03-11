const { Bot, webhookCallback } = require("grammy");
const express = require("express");
// const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const { FieldValue } = require('@google-cloud/firestore');
// const { Telegraf } = require('telegraf');

const Note = require('./db');

require("dotenv").config();

const bot = new Bot(process.env.TELEGRAM_TOKEN);
// const BOT = new Telegraf(process.env.TELEGRAM_TOKEN);

const app = express()

app.use(bodyParser.json())
app.use(cors())

bot.command("start", (ctx) => ctx.reply('Assalamualaikum, saya asisten purno, silahkan ketik /help untuk melihat perintah yang tersedia'));

bot.command('help', async (ctx) => {
    await bot.api.sendMessage(ctx.chat.id, `<b>Perintah yang tersedia:</b> 
    /help - menampilkan perintah yang tersedia 
    /info - menampilkan info bot 
    /wiki [text] - menampilkan hasil pencarian wikipedia 
    /note [text] - membuat catatan 
    /lihat - menampilkan catatan
    /hapus - untuk menghapus notes`, { parse_mode: 'HTML' },);

    // // ctx.telegram.deleteWebhook;
});

bot.command('info', async (ctx) => {
    await bot.api.sendMessage(ctx.chat.id, `<b>Info bot:</b> 
    <b>Bot Name:</b> Rumah Impian
    <b>Bot Username:</b> @rumahkitabersama_bot
    <b>version:</b> 1.0.0

    <b>Bot dibuat pada:</b> 07 Maret 2023`, { parse_mode: 'HTML' });

    // // ctx.telegram.deleteWebhook;
});


// wikipedia hasil tidak jelas
bot.command('wiki', async (ctx) => {

    ctx.reply('Dalam proses pengembangan');

    const query = ctx.message.text.split(' ').slice(1).join(' ');

    if (!query) {
        return ctx.reply('Silahkan masukkan kata kunci untuk pencarian');
    }

    const res = await axios.get(`${API_WIKI}+${query}`);
    const { title, timestamp } = res.data.query.search[0];

    // console.log(`ini dia: ${API_WIKI}+${query} dann iniiii ${res1.data.query.search[0]} dan juga ini ${res.data.query.search[0].title}`)

    // console.log(query)

    await bot.api.sendMessage(ctx.chat.id, `<b>${title}</b>
    ${timestamp}`, { parse_mode: 'HTML' });
    // ctx.telegram.deleteWebhook;

});


// belum berhasil (menampilkan cuaca)
bot.command('cuaca', async (ctx) => {

    ctx.reply('Dalam proses pengembangan');

    const query = ctx.message.text.split(' ').slice(1).join(' ');

    if (!query) {
        return ctx.reply('Silahkan masukkan nama kota untuk mengetahui cuaca');
    }

    const res = await axios.get(`${API_CUACA}${query}`);
    const { description, level } = res.data;
    const { data, lon } = res;

    // console.log(res.data, typeof lon)

    await bot.api.sendMessage(ctx.chat.id, `<b>${data}</b>
    ${level, lon}, { parse_mode: 'HTML' }`)
    // ctx.telegram.deleteWebhook;

});

bot.command('note', async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    const snapshot = await Note.orderBy('timestamp', 'desc').get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (!query) {
        return ctx.reply(`Silahkan masukkan note untuk disimpan`)
    }

    // waktu
    const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

    const ID = ctx.chat.id + data.length + 1;

    const toString = (ID) => { return ID.toString() };

    var notes = {
        "id_pribadi": toString(ID),
        "note": query,
        "id_tele": ctx.chat.id,
        "tgl": waktu,
        "timestamp": FieldValue.serverTimestamp()
    }

    await Note.add(notes);

    ctx.reply(`Note berhasil disimpan`)
    // ctx.telegram.deleteWebhook;
});

bot.command('lihat', async (ctx) => {
    const id_tele = ctx.chat.id;
    const snapshot = await Note.orderBy('timestamp', 'asc').where('id_tele', '==', id_tele).get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    var query = ctx.message.text.split(' ').slice(1).join(' ');

    if (snapshot.empty) {
        return ctx.reply(`Note kosong`)
    }

    if (!query) {
        // snapshot.forEach(doc => {console.log(doc.id, '=>', doc.data())});
        await bot.api.sendMessage(ctx.chat.id, `Pilih note yang ingin dilihat antara 1 \\- ${data.length} \n\n Reply /lihat [nomor]`, { parse_mode: "MarkdownV2" });
    } else {
        if (data.length < query) {
            return ctx.reply(`Note tidak ditemukan`)
        } else {
            query--;
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    if (query == key) {
                        var a = query + 1;
                        await bot.api.sendMessage(ctx.chat.id, `No: ${a} \nNote: ${data[query].note} \n\n\nTanggal: ${data[query].tgl}`)
                    }
                }
            }
        }
    }
    // ctx.telegram.deleteWebhook;
});


bot.command('hapus', async (ctx) => {
    const id_tele = ctx.chat.id;
    const snapshot = await Note.orderBy('timestamp', 'asc').where('id_tele', '==', id_tele).get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    var query = ctx.message.text.split(' ').slice(1).join(' ');

    if (snapshot.empty) {
        return ctx.reply(`Note kosong`)
    }

    if (!query) {
        // snapshot.forEach(doc => {console.log(doc.id, '=>', doc.data())});
        ctx.telegram.sendMessage(ctx.chat.id, `Pilih note yang ingin dihapus antara 1 \\- ${data.length} \n\n Reply /hapus [nomor]`, { parse_mode: "MarkdownV2" });
    } else {
        if (data.length < query) {
            return ctx.reply(`Note tidak ditemukan`)
        } else {
            query--;
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    if (query == key) {
                        // console.log('Berhasil dihapus');
                        const ID = data[key].id;
                        var a = query + 1;
                        delete ID;
                        await Note.doc(ID).delete();
                        await bot.api.sendMessage(ctx.chat.id, `No: ${a} \nBerhasil dihapus`, { parse_mode: "MarkdownV2" });
                    }
                }
            }
        }
    }
    // ctx.telegram.deleteWebhook;
});






















if (process.env.NODE_ENV === "production") {
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {;
  bot.start();
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));