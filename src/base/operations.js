const chalk = require("chalk");
const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");
const path = require("path");
const { removeUrlParameter, progressBar } = require("../Functions");
var videoStream;
var requested = {};

class Video {
    async getVideoInfo({ videoURL = null }) {
        if (videoURL == null) return new Error("Video URL'si girilmemiş.");
        const convertVideoURL = removeUrlParameter(videoURL, "list");
        return new Promise((resolve, reject) => {
            ytdl
                .getInfo(convertVideoURL)
                .then((info) => {
                    resolve(info);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    async downloadMp4({ URL, Name, Format, Info }) {
        try {
            videoStream = await ytdl(URL, { filter: "videoandaudio" });
            const format = await ytdl.chooseFormat(Format, { quality: "248" });
            let filteredName = Name.replace(/[^\w\s-çğıöşüÇĞİÖŞÜ]/g, '');
            const fileStream = await fs.createWriteStream(process.env.USERPROFILE + "/Downloads/" + `${filteredName}.${format.container}`);
            await videoStream.pipe(fileStream);

            console.log(Name + " isimli MP4 dosyası indiriliyor...");
            videoStream.on('progress', async (_, downloaded, total) => {
                console.clear();
                console.log(`${await progressBar(downloaded, total)} ${(downloaded / total).toFixed(2) * 100}% downloaded`);
            });
            fileStream.on("finish", () => {
                console.log("Video başarıyla indirildi:" + `${Name}.${format.container}`);
                const relatedVideosCopy = [...requested.related_videos];
                console.log(`${relatedVideosCopy.length > 0 ? `Tarzınıza uygun bir kaç şarkı bulundu indirmek için seçmeniz yeterli. \n
                ${chalk.yellow("3-) Başa Dön")}
                ${chalk.red("0-) İptal.")}\n${relatedVideosCopy.splice(0, 20).map(x => `${chalk.yellow(x.appointment + "-)")} ${x.title}`).join("\n")}` : ""}`);
            });

            fileStream.on("error", async (error) => {
                if (videoStream) await videoStream.destroy();
                console.error("Video kaydederken bir hata oluştu:", error);
            });
        } catch (error) {
            console.error("Video indirme işlemi sırasında bir hata oluştu:", error);
        }
    }

    async downloadMp3({ URL, Name }) {
        try {
            videoStream = ytdl(URL, { filter: "audioonly", quality: "highestaudio" });
            let filteredName = Name.replace(/[^\w\s-çğıöşüÇĞİÖŞÜ]/g, '');
            const filePath = path.join(process.env.USERPROFILE, "Downloads", `${filteredName}.mp3`);
            const fileStream = fs.createWriteStream(filePath);

            console.log(filteredName + " isimli MP3 dosyası indiriliyor...");

            videoStream.on('progress', async (_, downloaded, total) => {
                console.clear();
                console.log(`${await progressBar(downloaded, total)} ${(downloaded / total * 100).toFixed(2)}% downloaded`);
            });
            videoStream.pipe(fileStream);
            fileStream.on("finish", () => {
                console.log("Ses başarıyla indirildi: " + `${filteredName}.mp3`);
                const relatedVideosCopy = [...requested.related_videos];
                console.log(`${relatedVideosCopy.length > 0 ? `Tarzınıza uygun bir kaç şarkı bulundu indirmek için seçmeniz yeterli.
${chalk.yellow("3-) Başa Dön")}
${chalk.red("0-) İptal.")}\n ${relatedVideosCopy.splice(0, 20).map(x => `${chalk.yellow(x.appointment + "-)")} ${x.title}`).join("\n")}` : ""}`);
            });

            fileStream.on("error", async (error) => {
                if (videoStream) await videoStream.destroy();
                console.clear();
                console.error("Ses kaydederken bir hata oluştu:", error);
            });

        } catch (error) {
            console.clear();
            console.error("Ses indirme işlemi sırasında bir hata oluştu:", error);
        }
    }

    async search({ URL }) {
        console.clear();
        console.log("Lütfen Bekleyiniz...");
        this.getVideoInfo({ videoURL: URL })
            .then((obtainedVideoInfo) => {
                console.clear();
                requested.URL = URL;
                requested.Name = obtainedVideoInfo.videoDetails.title;
                requested.Format = obtainedVideoInfo.formats;
                requested.related_videos = obtainedVideoInfo.related_videos.splice(0, 17).map((x, i = 4) => ({ title: x.title, url: `https://www.youtube.com/watch?v=${x.id}`, appointment: i + 3 }));
                requested.related_videos_display = [...requested.related_videos]; // Copy for display
                requested.info = obtainedVideoInfo;
                console.log(`${chalk.bold("Video Bilgileri")}
 --------------------------------
 ${chalk.yellow("Başlık:")} ${obtainedVideoInfo.videoDetails.title}
 ${chalk.yellow("Yazar Adı:")} ${obtainedVideoInfo.videoDetails.author.name}
 ${chalk.yellow("Kullanıcı Adı:")} ${obtainedVideoInfo.videoDetails.author.user}
 ${chalk.yellow("Kanal URL:")} ${obtainedVideoInfo.videoDetails.author.channel_url}
 ${chalk.yellow("Doğrulanmış:")} ${obtainedVideoInfo.videoDetails.author.verified ? "Evet" : "Hayır"}
 ${chalk.yellow(`Video Süresi (saniye):`)} ${obtainedVideoInfo.videoDetails.lengthSeconds}
 ${chalk.yellow(`Anahtar Kelimeler (${obtainedVideoInfo.videoDetails.keywords?.length ?? 0 > 0 ? obtainedVideoInfo.videoDetails.keywords.length : 0}):`)} ${obtainedVideoInfo.videoDetails.keywords?.length ?? 0 > 0 ? obtainedVideoInfo.videoDetails.keywords.splice(0, 7).join(", ") : "Yok"}"
 ${chalk.yellow("Kategori:")} ${obtainedVideoInfo.videoDetails.category}
 ${chalk.yellow("Yükleme Tarihi:")} ${obtainedVideoInfo.videoDetails.uploadDate}
 ${chalk.yellow("İzlenme Sayısı:")} ${obtainedVideoInfo.videoDetails.viewCount}
 ${chalk.yellow(`Kullanılabilir Ülkeler (${obtainedVideoInfo.videoDetails.availableCountries?.length ?? 0 > 0 ? obtainedVideoInfo.videoDetails.availableCountries.length : 0}):`)} ${obtainedVideoInfo.videoDetails.availableCountries?.length ?? 0 > 0 ? obtainedVideoInfo.videoDetails.availableCountries.splice(0, 7).join(", ") : "Yok"}
 --------------------------------
 `);
                console.log(`${chalk.bold.green("Videu'yu indirmek için aşağıdaki seçeneklerden birini seçiniz:")}
 ${chalk.yellow("1-) Video Olarak İndir.")}
 ${chalk.yellow("2-) MP3 Olarak İndir.")}
 ${chalk.yellow("3-) Başa Dön")}
 ${chalk.red("0-) İptal.")}\n`);
            })
            .catch((err) => {
                console.log(err);
                rl.close();
            });
    }
}

class Interface {
    async theBeginning() {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, });
        console.clear();
        const video = new Video();
        rl.question(`Video URL'si giriniz.\n`, (enteredVideoURL) => {
            console.clear();
            console.log("Lütfen Bekleyiniz...");
            video
                .getVideoInfo({ videoURL: enteredVideoURL })
                .then((obtainedVideoInfo) => {
                    console.clear();
                    requested.URL = enteredVideoURL;
                    requested.Name = obtainedVideoInfo.videoDetails.title;
                    requested.Format = obtainedVideoInfo.formats;
                    requested.related_videos = obtainedVideoInfo.related_videos.splice(0, 17).map((x, i = 4) => ({ title: x.title, url: `https://www.youtube.com/watch?v=${x.id}`, appointment: i + 3 }));
                    requested.related_videos_display = [...requested.related_videos]; // Copy for display
                    requested.info = obtainedVideoInfo;
                    console.log(`${chalk.bold("Video Bilgileri")}
 --------------------------------
 ${chalk.yellow("Başlık:")} ${obtainedVideoInfo.videoDetails.title}
 ${chalk.yellow("Yazar Adı:")} ${obtainedVideoInfo.videoDetails.author.name}
 ${chalk.yellow("Kullanıcı Adı:")} ${obtainedVideoInfo.videoDetails.author.user}
 ${chalk.yellow("Kanal URL:")} ${obtainedVideoInfo.videoDetails.author.channel_url}
 ${chalk.yellow("Doğrulanmış:")} ${obtainedVideoInfo.videoDetails.author.verified ? "Evet" : "Hayır"}
 ${chalk.yellow(`Video Süresi (saniye):`)} ${obtainedVideoInfo.videoDetails.lengthSeconds}
 ${chalk.yellow(`Anahtar Kelimeler (${obtainedVideoInfo.videoDetails.keywords?.length ?? 0 > 0 ? obtainedVideoInfo.videoDetails.keywords.length : 0}):`)} ${obtainedVideoInfo.videoDetails.keywords?.length ?? 0 > 0 ? obtainedVideoInfo.videoDetails.keywords.splice(0, 7).join(", ") : "Yok"}"
 ${chalk.yellow("Kategori:")} ${obtainedVideoInfo.videoDetails.category}
 ${chalk.yellow("Yükleme Tarihi:")} ${obtainedVideoInfo.videoDetails.uploadDate}
 ${chalk.yellow("İzlenme Sayısı:")} ${obtainedVideoInfo.videoDetails.viewCount}
 ${chalk.yellow(`Kullanılabilir Ülkeler (${obtainedVideoInfo.videoDetails.availableCountries?.length ?? 0 > 0 ? obtainedVideoInfo.videoDetails.availableCountries.length : 0}):`)} ${obtainedVideoInfo.videoDetails.availableCountries?.length ?? 0 > 0 ? obtainedVideoInfo.videoDetails.availableCountries.splice(0, 7).join(", ") : "Yok"}
 --------------------------------
 `);
                    console.log(`${chalk.bold.green("Videu'yu indirmek için aşağıdaki seçeneklerden birini seçiniz:")}
 ${chalk.yellow("1-) Video Olarak İndir.")}
 ${chalk.yellow("2-) MP3 Olarak İndir.")}
 ${chalk.yellow("3-) Başa Dön")}
 ${chalk.red("0-) İptal.")}\n`);

                    rl.on("line", async (input) => {
                        try {
                            if (input === "3") {
                                console.clear();
                                if (rl) rl.close();
                                await this.theBeginning();
                            }
                            if (input === "0") {
                                console.clear();
                                if (videoStream) await videoStream.destroy();
                                console.log("Approval CYB | https://github.com/approval-Denial");
                                if (rl) rl.close();
                            }
                            if (input === "1") {
                                console.clear();
                                await video.downloadMp4({
                                    URL: requested.URL,
                                    Name: requested.Name,
                                    Format: requested.Format,
                                });
                            }
                            if (input === "2") {
                                console.clear();
                                await video.downloadMp3({ URL: requested.URL, Name: requested.Name });
                            }
                            if (requested.related_videos_display.some(x => x.appointment == input)) {
                                const related_video = requested.related_videos_display.find(x => x.appointment == input);
                                if (input === `${related_video.appointment}`) {
                                    console.clear();
                                    if (videoStream) await videoStream.destroy();
                                    console.log("Lütfen Bekleyiniz...");
                                    await video.search({ URL: related_video.url });
                                }
                            }
                        } catch (error) {
                            console.error("Bir hata oluştu:", error);
                        }
                    });
                })
                .catch((err) => {
                    console.log(err);
                    rl.close();
                });
        });
    }
}
module.exports = { Video, Interface };
