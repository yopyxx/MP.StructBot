// @ts-nocheck
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID || "1476787258815152183";
const CLIENT_ID = process.env.CLIENT_ID;

const DATA_FILE = path.join(__dirname, "organization.json");

const SUPER_ADMIN_IDS = new Set([
  "942558158436589640",
  "1369378060557877480",
]);

const LEVEL_ROLES = {
  1: ["1484576766399086752"],
  2: ["1488035122585538651"],
  3: ["1386716926553882720"],
};

const DEPT_ASSIGN_ROLES = {
  소령: [
    "1452598334572462083", // 소령
    "1410595975873171538", // 지휘장교
    "1448215361659867136", // 수뇌부
    "1484955943237193909", // 인사행정단
    "1487030918794313758", // 간부
    "1386716926528585857", // 장교
  ],
  중령: [
    "1452598180947562529", // 중령
    "1410595975873171538", // 지휘장교
    "1448215361659867136", // 수뇌부
    "1484955943237193909", // 인사행정단
    "1487030918794313758", // 간부
    "1386716926528585857", // 장교
  ],
  대령: [
    "1449732731364966490", // 지휘단장
    "1484576766399086752", // 군수단
    "1452598529301414041", // 대령
    "1410595975873171538", // 지휘장교
    "1448215361659867136", // 수뇌부
    "1487030918794313758", // 간부
    "1386716926528585857", // 장교
  ],
};

// 자동 편제 추가 제외 역할
const AUTO_ADD_EXCLUDED_ROLE_IDS = new Set([
  "1484936041625423984",
  "1484585221113249822",
  "1458739699551174666",
  "1486635044058435684",
  "1487715425801211924",
  "1486399717226319953",
  "1475031533378211862",
  "1488511399540953291",
]);

// 자동 편제 추가 대상 계급 역할
const BULK_ADD_ROLE_IDS = {
  소령: "1452598334572462083",
  중령: "1452598180947562529",
  대령: "1452598529301414041",
};

const COMMAND_HQ_POSITIONS = [
  "군사경찰 사령관",
  "군사경찰 부사령관",
  "군사경찰 참모장",
];

const UNIT_COMMAND_POSITIONS = {
  근무지원단: [
    "근무지원단장",
    "근무지원부단장",
    "근무지원참모장",
    "근무지원주임원사",
  ],
  인사처리단: [
    "인사처리단장",
    "인사처리부단장",
    "인사처리참모장",
    "인사처리주임원사",
  ],
  군수단: [
    "군수단장",
    "군수부단장",
    "군수참모장",
    "군수주임원사",
  ],
  인사행정단: [
    "인사행정단장",
    "인사행정부단장",
    "인사행정참모장",
    "인사행정주임원사",
  ],
};

const HQ_EMOJIS = {
  "군사경찰 사령관": "<:General:1478002425830047754>",
  "군사경찰 부사령관": "<:LieutenantGeneral:1480151141969956944>",
  "군사경찰 참모장": "<:LieutenantGeneral:1480151141969956944>",
  인사행정단장: "<:brigadier:1478002619577405500>",
  근무지원단장: "<:brigadier:1478002619577405500>",
  인사처리단장: "<:brigadier:1478002619577405500>",
  군수단장: "<:brigadier:1478002619577405500>",
  근무지원부단장: "<:Colonel:1478005729146179645>",
  근무지원참모장: "<:Colonel:1478005729146179645>",
  근무지원주임원사: "<:sergeantmajor:1478002719645106248>",
  인사처리부단장: "<:Colonel:1478005729146179645>",
  인사처리참모장: "<:Colonel:1478005729146179645>",
  인사처리주임원사: "<:sergeantmajor:1478002719645106248>",
  군수부단장: "<:Colonel:1478005729146179645>",
  군수참모장: "<:Colonel:1478005729146179645>",
  군수주임원사: "<:sergeantmajor:1478002719645106248>",
  인사행정부단장: "<:Colonel:1478005729146179645>",
  인사행정참모장: "<:Colonel:1478005729146179645>",
  인사행정주임원사: "<:sergeantmajor:1478002719645106248>",
};

const ORG_EMOJIS = {
  colonel: "<:Colonel:1478005729146179645>",
  ltcolonel: "<:Lieutenant_Colonel:1478005839427141744>",
  major: "<:Major:1478005902702284971>",
};

const LIMITS = {
  대령: 30,
  중령: 40,
  소령: 70,
};

const DIVIDER_IMAGE_URL =
  "https://cdn.discordapp.com/attachments/1487788185030492301/1487807323198984302/5_1.png?ex=69ca7c0b&is=69c92a8b&hm=fcdc6abe264013b843d8a58b522142ed930e433e399c4d89618e1bbbb410c4b0";

const TITLE_ICON_URL =
  "https://cdn.discordapp.com/attachments/1487848573650468996/1487848651916054809/7b6320370920beaf.png?ex=69caa289&is=69c95109&hm=3058ec090c27eafb9e2760781ff6f641a918a53b122a3e30083c6301c2e6cb92";

const RANK_EMBED_CONFIG = [
  ["대령", "지휘단장", ORG_EMOJIS.colonel],
  ["중령", "지휘장교", ORG_EMOJIS.ltcolonel],
  ["소령", "지휘장교", ORG_EMOJIS.major],
];

const EMBED1_SECTIONS = [
  ["**[+] 사령본부**", ["군사경찰 사령관", "군사경찰 부사령관", "군사경찰 참모장"]],
  ["**[+] 단본부**", ["인사행정단장", "근무지원단장", "인사처리단장", "군수단장"]],
];

const EMBED2_SECTIONS = [
  [
    "**[+] 인사행정단 수뇌부**",
    ["인사행정단장", "인사행정부단장", "인사행정참모장", "인사행정주임원사"],
  ],
  [
    "**[+] 근무지원단 수뇌부**",
    ["근무지원단장", "근무지원부단장", "근무지원참모장", "근무지원주임원사"],
  ],
  [
    "**[+] 인사처리단 수뇌부**",
    ["인사처리단장", "인사처리부단장", "인사처리참모장", "인사처리주임원사"],
  ],
  [
    "**[+] 군수단 수뇌부**",
    ["군수단장", "군수부단장", "군수참모장", "군수주임원사"],
  ],
];

const MANAGED_DEPT_ROLE_IDS = new Set(
  Object.values(DEPT_ASSIGN_ROLES).flat()
);

function defaultData() {
  return {
    편제: {
      사령본부: [],
      대령: [],
      중령: [],
      소령: [],
    },
    공지: {
      messageId: null,
      channelId: null,
    },
  };
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return defaultData();

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const base = defaultData();

    if (!parsed.편제 || typeof parsed.편제 !== "object") parsed.편제 = base.편제;
    if (!parsed.공지 || typeof parsed.공지 !== "object") parsed.공지 = base.공지;

    for (const key of Object.keys(base.편제)) {
      if (!Array.isArray(parsed.편제[key])) parsed.편제[key] = [];
    }

    if (!("messageId" in parsed.공지)) parsed.공지.messageId = null;
    if (!("channelId" in parsed.공지)) parsed.공지.channelId = null;

    return parsed;
  } catch (err) {
    console.log(`organization.json 파싱 실패: ${err}`);
    return defaultData();
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

const store = loadData();

function validateEnv() {
  const missing = [];
  if (!TOKEN) missing.push("TOKEN");
  if (!GUILD_ID) missing.push("GUILD_ID");
  if (!CLIENT_ID) missing.push("CLIENT_ID");

  if (missing.length) {
    console.log(`필수 환경변수가 없습니다: ${missing.join(", ")}`);
    process.exit(1);
  }
}

function getUserLevel(member) {
  if (!member) return 0;
  if (SUPER_ADMIN_IDS.has(String(member.id))) return 999;

  const roleIds = new Set(member.roles.cache.map((r) => String(r.id)));

  for (const level of [3, 2, 1]) {
    if ((LEVEL_ROLES[level] || []).some((roleId) => roleIds.has(roleId))) {
      return level;
    }
  }
  return 0;
}

function removeUserFromOrganization(targetId) {
  const targetIdStr = String(targetId);
  let removed = false;

  for (const dept of Object.keys(LIMITS)) {
    const before = store.편제[dept].length;
    store.편제[dept] = store.편제[dept].filter(
      (member) => String(member.id) !== targetIdStr
    );
    if (store.편제[dept].length !== before) removed = true;
  }

  const beforeHq = store.편제.사령본부.length;
  store.편제.사령본부 = store.편제.사령본부.filter(
    (member) => String(member.id) !== targetIdStr
  );
  if (store.편제.사령본부.length !== beforeHq) removed = true;

  return removed;
}

function getPositionEntry(position) {
  return store.편제.사령본부.find((member) => member.position === position) || null;
}

function isRegistered(memberId) {
  const memberIdStr = String(memberId);

  if (store.편제.사령본부.some((member) => String(member.id) === memberIdStr)) {
    return true;
  }

  return Object.keys(LIMITS).some((dept) =>
    store.편제[dept].some((member) => String(member.id) === memberIdStr)
  );
}

function getActiveDeptMembers(guild, dept) {
  return store.편제[dept].filter((memberData) =>
    guild.members.cache.has(String(memberData.id))
  );
}

async function safeFetchMember(guild, userId) {
  const cached = guild.members.cache.get(String(userId));
  if (cached) return cached;
  try {
    return await guild.members.fetch(String(userId));
  } catch {
    return null;
  }
}

async function reply(interaction, options) {
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(options);
  }
  return interaction.reply(options);
}

async function requireGuild(interaction) {
  const guild = interaction.guild;
  if (!guild) {
    await reply(interaction, { content: "❌ 길드에서만 사용 가능합니다.", ephemeral: true });
    return null;
  }
  return guild;
}

async function getExecutorLevel(interaction, guild) {
  const executor = await safeFetchMember(guild, interaction.user.id);
  return getUserLevel(executor);
}

async function persistAndRefresh(guild) {
  saveData(store);
  await refreshNoticeIfExists(guild);
}

async function syncDeptRoles(member, dept, guild) {
  const desiredRoleIds = new Set(DEPT_ASSIGN_ROLES[dept] || []);

  const currentManagedRoles = member.roles.cache.filter((role) =>
    MANAGED_DEPT_ROLE_IDS.has(String(role.id))
  );

  const rolesToRemove = currentManagedRoles.filter(
    (role) => !desiredRoleIds.has(String(role.id))
  );
  if (rolesToRemove.size > 0) {
    await member.roles.remove([...rolesToRemove.values()], "조직 편제 역할 교체");
  }

  const currentRoleIds = new Set(member.roles.cache.map((role) => String(role.id)));
  const rolesToAdd = [];

  for (const roleId of desiredRoleIds) {
    if (currentRoleIds.has(roleId)) continue;
    const role = guild.roles.cache.get(roleId);
    if (role) rolesToAdd.push(role);
  }

  if (rolesToAdd.length > 0) {
    await member.roles.add(rolesToAdd, "조직 편제 역할 부여");
  }
}

function memberHasAnyExcludedRole(member) {
  return member.roles.cache.some((role) =>
    AUTO_ADD_EXCLUDED_ROLE_IDS.has(String(role.id))
  );
}

async function bulkAddByRankRole(interaction, guild, dept) {
  const userLevel = await getExecutorLevel(interaction, guild);
  if (userLevel < 2) {
    await reply(interaction, { content: "❌ 사령본부 이상만 사용 가능합니다.", ephemeral: true });
    return;
  }

  const targetRoleId = BULK_ADD_ROLE_IDS[dept];
  const targetRole = guild.roles.cache.get(targetRoleId);

  if (!targetRole) {
    await reply(interaction, {
      content: `❌ ${dept} 대상 역할을 찾을 수 없습니다.`,
      ephemeral: true,
    });
    return;
  }

  const candidates = [];
  const excludedMembers = [];
  const overLimitSkipped = [];
  const addedMembers = [];
  const updatedMembers = [];

  for (const member of targetRole.members.values()) {
    if (member.user.bot) continue;

    if (memberHasAnyExcludedRole(member)) {
      excludedMembers.push(member);
      continue;
    }

    candidates.push(member);
  }

  for (const member of candidates) {
    const alreadyInSameDept = store.편제[dept].some(
      (entry) => String(entry.id) === String(member.id)
    );

    if (alreadyInSameDept) {
      removeUserFromOrganization(member.id);
      store.편제[dept].push({
        id: String(member.id),
        nickname: member.displayName,
      });
      await syncDeptRoles(member, dept, guild);
      updatedMembers.push(member);
      continue;
    }

    if (getActiveDeptMembers(guild, dept).length >= LIMITS[dept]) {
      overLimitSkipped.push(member);
      continue;
    }

    removeUserFromOrganization(member.id);
    store.편제[dept].push({
      id: String(member.id),
      nickname: member.displayName,
    });
    await syncDeptRoles(member, dept, guild);
    addedMembers.push(member);
  }

  await persistAndRefresh(guild);

  const lines = [
    `✅ ${dept} 편제 전체추가 완료`,
    `대상 역할 인원: ${candidates.length}명`,
    `신규 추가: ${addedMembers.length}명`,
    `기존 갱신: ${updatedMembers.length}명`,
    `제외 역할로 스킵: ${excludedMembers.length}명`,
    `정원 초과로 스킵: ${overLimitSkipped.length}명`,
  ];

  if (excludedMembers.length > 0) {
    lines.push("", "**제외 역할로 스킵된 인원**");
    lines.push(excludedMembers.slice(0, 20).map((m) => m.toString()).join("\n"));
  }

  if (overLimitSkipped.length > 0) {
    lines.push("", "**정원 초과로 스킵된 인원**");
    lines.push(overLimitSkipped.slice(0, 20).map((m) => m.toString()).join("\n"));
  }

  await reply(interaction, {
    content: lines.join("\n"),
    ephemeral: true,
  });
}

function formatMemberLine(member, nickname, highlightUserId = null) {
  const base = `${member} / ${nickname}`;
  return highlightUserId === member.id ? `**${base} ⭐**` : base;
}

function formatPositionMember(member, highlightUserId = null) {
  return highlightUserId === member.id ? `**${member} ⭐**` : `${member}`;
}

function formatRoleMentions(guild, roleIds) {
  const mentions = roleIds.map((roleId) => {
    const role = guild.roles.cache.get(String(roleId));
    return role ? role.toString() : `<@&${roleId}>`;
  });
  return mentions.length ? mentions.join(" / ") : "없음";
}

function buildPositionLine(guild, position, highlightUserId = null) {
  const emoji = HQ_EMOJIS[position] || "";
  const memberData = getPositionEntry(position);

  if (!memberData) return `${emoji} | ${position} : 공석`;

  const member = guild.members.cache.get(String(memberData.id));
  if (!member) return `${emoji} | ${position} : 공석`;

  return `${emoji} | ${position} : ${formatPositionMember(member, highlightUserId)}`;
}

function buildRankLines(guild, dept, highlightUserId = null) {
  const lines = [];
  for (const memberData of getActiveDeptMembers(guild, dept)) {
    const member = guild.members.cache.get(String(memberData.id));
    if (member) {
      lines.push(formatMemberLine(member, memberData.nickname, highlightUserId));
    }
  }
  return lines;
}

function buildSectionDescription(guild, sections, highlightUserId = null) {
  const lines = [];
  for (const [title, positions] of sections) {
    if (lines.length) lines.push("");
    lines.push(title);
    for (const position of positions) {
      lines.push(buildPositionLine(guild, position, highlightUserId));
    }
  }
  return lines.join("\n");
}

function buildRankRosterEmbed(guild, highlightUserId = null) {
  const embed = new EmbedBuilder()
    .setTitle("지휘단장 / 지휘장교 편제")
    .setColor(0x5865f2);

  for (const [dept, label, emoji] of RANK_EMBED_CONFIG) {
    const activeMembers = getActiveDeptMembers(guild, dept);
    const members = buildRankLines(guild, dept, highlightUserId);

    embed.addFields({
      name: `${emoji} | ${label} (${dept} : ${activeMembers.length}/${LIMITS[dept]}명)`,
      value: members.length ? members.join("\n") : "없음",
      inline: false,
    });
  }

  embed.setImage(DIVIDER_IMAGE_URL);
  return embed;
}

function buildEmbeds(guild, highlightUserId = null) {
  const embed1 = new EmbedBuilder()
    .setDescription(buildSectionDescription(guild, EMBED1_SECTIONS, highlightUserId))
    .setColor(0x1f3a93)
    .setAuthor({ name: "군사경찰 편제현황", iconURL: TITLE_ICON_URL })
    .setImage(DIVIDER_IMAGE_URL);

  const embed2 = new EmbedBuilder()
    .setDescription(buildSectionDescription(guild, EMBED2_SECTIONS, highlightUserId))
    .setColor(0x2ecc71)
    .setImage(DIVIDER_IMAGE_URL);

  const embed3 = buildRankRosterEmbed(guild, highlightUserId);

  return [embed1, embed2, embed3];
}

function buildMainEmbeds(guild, highlightUserId = null) {
  return buildEmbeds(guild, highlightUserId).slice(0, 2);
}

function buildDetailEmbed(guild, highlightUserId = null) {
  return buildEmbeds(guild, highlightUserId)[2];
}

function buildRankSystemEmbed() {
  return new EmbedBuilder()
    .setTitle("직급 체계")
    .setDescription(
      "`사령관` (대장)\n" +
        "-> `부사령관` (중장)\n" +
        "-> `참모장` (소장)\n" +
        "-> `실 주임원사`\n" +
        "-> `부서 단장` (준장)\n" +
        "-> `부서 부단장` (대령)\n" +
        "-> `부서 참모장` (대령)\n" +
        "-> `부서 주임원사`\n" +
        "-> `지휘단장` (대령)\n" +
        "-> `지휘장교` (중령)\n" +
        "-> `지휘장교` (소령)\n" +
        "-> `위관급 장교` (소위~대위)\n" +
        "-> `부사관` (하사~상사)\n" +
        "-> `병사` (이등병~병장)"
    )
    .setColor(0xf1c40f);
}

function buildPermissionEmbed(guild) {
  const formatMemberList = (members) =>
    members.length ? members.map((m) => m.toString()).join("\n") : "없음";

  const superAdmins = [...SUPER_ADMIN_IDS]
    .map((id) => guild.members.cache.get(id))
    .filter(Boolean);

  const levelMembers = {};
  for (const [level, roleIds] of Object.entries(LEVEL_ROLES)) {
    const matched = guild.members.cache.filter((member) =>
      member.roles.cache.some((role) => roleIds.includes(String(role.id)))
    );
    levelMembers[level] = [...matched.values()];
  }

  return new EmbedBuilder()
    .setTitle("권한 현황")
    .setColor(0xe67e22)
    .addFields(
      {
        name: "최상위 관리자",
        value: formatMemberList(superAdmins),
        inline: false,
      },
      {
        name: "Level 3",
        value: `역할: ${formatRoleMentions(guild, LEVEL_ROLES[3])}\n${formatMemberList(
          levelMembers[3] || []
        )}`,
        inline: false,
      },
      {
        name: "Level 2",
        value: `역할: ${formatRoleMentions(guild, LEVEL_ROLES[2])}\n${formatMemberList(
          levelMembers[2] || []
        )}`,
        inline: false,
      },
      {
        name: "Level 1",
        value: `역할: ${formatRoleMentions(guild, LEVEL_ROLES[1])}\n${formatMemberList(
          levelMembers[1] || []
        )}`,
        inline: false,
      }
    );
}

function buildNoticeButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("organization:show_command_roster")
      .setLabel("📋 편제 전체보기")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("organization:show_rank_system")
      .setLabel("직급체계 보기")
      .setStyle(ButtonStyle.Primary)
  );
}

async function fetchNoticeMessage(client) {
  const notice = store.공지 || {};
  const messageId = notice.messageId;
  const channelId = notice.channelId;

  if (!messageId || !channelId) return { channel: null, message: null, errorCode: null };

  try {
    const channel = await client.channels.fetch(String(channelId));
    if (
      !channel ||
      ![ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(channel.type)
    ) {
      return { channel, message: null, errorCode: null };
    }

    const message = await channel.messages.fetch(String(messageId));
    return { channel, message, errorCode: null };
  } catch (err) {
    if (err.code === 10008) {
      return { channel: null, message: null, errorCode: "not_found" };
    }
    return { channel: null, message: null, errorCode: "fetch_failed" };
  }
}

async function refreshNoticeIfExists(guild) {
  try {
    const { message, errorCode } = await fetchNoticeMessage(client);

    if (errorCode === "not_found") {
      store.공지.messageId = null;
      store.공지.channelId = null;
      saveData(store);
      return;
    }

    if (!message) return;

    await message.edit({
      embeds: buildMainEmbeds(guild),
      components: [buildNoticeButtons()],
    });
  } catch (err) {
    console.log(`공지 자동 갱신 실패: ${err}`);
  }
}

async function assignHqPosition(interaction, position, target, deniedMessage) {
  const guild = await requireGuild(interaction);
  if (!guild) return;

  const userLevel = await getExecutorLevel(interaction, guild);
  if (userLevel < 3) {
    await reply(interaction, { content: deniedMessage, ephemeral: true });
    return;
  }

  try {
    store.편제.사령본부 = store.편제.사령본부.filter(
      (member) =>
        member.position !== position && String(member.id) !== String(target.id)
    );

    store.편제.사령본부.push({
      position,
      id: String(target.id),
      nickname: target.displayName,
    });

    await persistAndRefresh(guild);

    await reply(interaction, {
      content: `✅ ${target} → ${position} 등록 완료`,
      ephemeral: true,
    });
  } catch (err) {
    console.log(`명령 처리 중 오류: ${err}`);
    await reply(interaction, {
      content:
        "❌ 처리 중 오류가 발생했습니다. 봇 역할 위치, Manage Roles 권한, 환경변수를 확인해주세요.",
      ephemeral: true,
    });
  }
}

validateEnv();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const commands = [
  new SlashCommandBuilder()
    .setName("편제추가")
    .setDescription("대령 / 중령 / 소령 편제에 인원을 추가합니다.")
    .addStringOption((option) =>
      option
        .setName("부서")
        .setDescription("추가할 부서")
        .setRequired(true)
        .addChoices(
          { name: "대령", value: "대령" },
          { name: "중령", value: "중령" },
          { name: "소령", value: "소령" }
        )
    )
    .addUserOption((option) =>
      option.setName("대상").setDescription("추가할 멤버").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("닉네임").setDescription("표기할 닉네임").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("소령편제전체추가")
    .setDescription("소령 역할 보유 인원을 전부 소령 편제에 추가합니다."),

  new SlashCommandBuilder()
    .setName("중령편제전체추가")
    .setDescription("중령 역할 보유 인원을 전부 중령 편제에 추가합니다."),

  new SlashCommandBuilder()
    .setName("대령편제전체추가")
    .setDescription("대령 역할 보유 인원을 전부 대령 편제에 추가합니다."),

  new SlashCommandBuilder()
    .setName("사령본부추가")
    .setDescription("사령본부 직책에 인원을 배치합니다.")
    .addStringOption((option) =>
      option
        .setName("직책")
        .setDescription("직책 선택")
        .setRequired(true)
        .addChoices(...COMMAND_HQ_POSITIONS.map((p) => ({ name: p, value: p })))
    )
    .addUserOption((option) =>
      option.setName("대상").setDescription("배치할 멤버").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("단수뇌부추가")
    .setDescription("단 수뇌부 직책에 인원을 배치합니다.")
    .addStringOption((option) =>
      option
        .setName("단")
        .setDescription("배치할 단")
        .setRequired(true)
        .addChoices(
          ...Object.keys(UNIT_COMMAND_POSITIONS).map((unit) => ({
            name: unit,
            value: unit,
          }))
        )
    )
    .addStringOption((option) =>
      option.setName("직책").setDescription("직책 선택").setRequired(true).setAutocomplete(true)
    )
    .addUserOption((option) =>
      option.setName("대상").setDescription("배치할 멤버").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("편제삭제")
    .setDescription("등록된 인원을 모든 편제에서 제거합니다.")
    .addUserOption((option) =>
      option.setName("대상").setDescription("삭제할 멤버").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("권한현황")
    .setDescription("현재 권한 레벨 보유 인원을 확인합니다."),

  new SlashCommandBuilder()
    .setName("찾기")
    .setDescription("멘션한 인원이 어느 편제에 있는지 확인합니다.")
    .addUserOption((option) =>
      option.setName("대상").setDescription("찾을 멤버").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("공지")
    .setDescription("현재 편제현황을 지정 채널에 공지로 등록합니다.")
    .addChannelOption((option) =>
      option
        .setName("채널")
        .setDescription("공지할 채널")
        .setRequired(true)
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.AnnouncementThread
        )
    ),

  new SlashCommandBuilder()
    .setName("공지수정")
    .setDescription("등록된 편제 공지를 최신 정보로 수정합니다."),
].map((cmd) => cmd.toJSON());

client.once("ready", async () => {
  console.log(`✅ 로그인 완료: ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.members.fetch();
    console.log("✅ 길드 멤버 캐시 로드 완료");
  } catch (err) {
    console.log(`⚠️ 길드 멤버 전체 fetch 실패: ${err}`);
  }

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log("✅ 글로벌 슬래시 명령어 정리 완료");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ 길드 슬래시 명령어 등록 완료");
  } catch (err) {
    console.log(`❌ 슬래시 명령어 등록 실패: ${err}`);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName === "단수뇌부추가") {
        const selectedUnit = interaction.options.getString("단");
        const current = interaction.options.getFocused();
        let positions = UNIT_COMMAND_POSITIONS[selectedUnit] || [];

        if (!positions.length) {
          positions = Object.values(UNIT_COMMAND_POSITIONS).flat();
        }

        const filtered = positions
          .filter((position) => position.includes(current))
          .slice(0, 25)
          .map((position) => ({ name: position, value: position }));

        await interaction.respond(filtered);
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === "organization:show_command_roster") {
        const guild = await requireGuild(interaction);
        if (!guild) return;

        await reply(interaction, {
          embeds: [buildDetailEmbed(guild, interaction.user.id)],
          ephemeral: true,
        });
        return;
      }

      if (interaction.customId === "organization:show_rank_system") {
        await reply(interaction, {
          embeds: [buildRankSystemEmbed()],
          ephemeral: true,
        });
        return;
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const guild = await requireGuild(interaction);
    if (!guild) return;

    if (interaction.commandName === "편제추가") {
      const dept = interaction.options.getString("부서", true);
      const targetUser = interaction.options.getUser("대상", true);
      const nickname = interaction.options.getString("닉네임", true);
      const target = await safeFetchMember(guild, targetUser.id);

      if (!target) {
        await reply(interaction, { content: "❌ 대상을 찾을 수 없습니다.", ephemeral: true });
        return;
      }

      const userLevel = await getExecutorLevel(interaction, guild);

      if (userLevel === 0) {
        await reply(interaction, { content: "❌ 권한이 없습니다.", ephemeral: true });
        return;
      }

      if (userLevel === 1 && dept !== "소령") {
        await reply(interaction, {
          content: "❌ 대령 권한은 소령 편제만 추가 가능합니다.",
          ephemeral: true,
        });
        return;
      }

      if (!LIMITS[dept]) {
        await reply(interaction, { content: "❌ 잘못된 부서입니다.", ephemeral: true });
        return;
      }

      const currentDeptMembers = store.편제[dept];
      const alreadyInSameDept = currentDeptMembers.some(
        (member) => String(member.id) === String(target.id)
      );

      if (!alreadyInSameDept && getActiveDeptMembers(guild, dept).length >= LIMITS[dept]) {
        await reply(interaction, { content: "❌ 최대 인원 초과", ephemeral: true });
        return;
      }

      try {
        removeUserFromOrganization(target.id);
        store.편제[dept].push({ id: String(target.id), nickname });
        await syncDeptRoles(target, dept, guild);
        await persistAndRefresh(guild);

        await reply(interaction, {
          content: `✅ ${target} 님을 ${dept} 편제에 등록했고, 관련 계급 역할만 교체했습니다.`,
          ephemeral: true,
        });
      } catch (err) {
        console.log(`명령 처리 중 오류: ${err}`);
        await reply(interaction, {
          content:
            "❌ 처리 중 오류가 발생했습니다. 봇 역할 위치, Manage Roles 권한, 환경변수를 확인해주세요.",
          ephemeral: true,
        });
      }
      return;
    }

    if (interaction.commandName === "소령편제전체추가") {
      await bulkAddByRankRole(interaction, guild, "소령");
      return;
    }

    if (interaction.commandName === "중령편제전체추가") {
      await bulkAddByRankRole(interaction, guild, "중령");
      return;
    }

    if (interaction.commandName === "대령편제전체추가") {
      await bulkAddByRankRole(interaction, guild, "대령");
      return;
    }

    if (interaction.commandName === "사령본부추가") {
      const position = interaction.options.getString("직책", true);
      const targetUser = interaction.options.getUser("대상", true);
      const target = await safeFetchMember(guild, targetUser.id);

      if (!target) {
        await reply(interaction, { content: "❌ 대상을 찾을 수 없습니다.", ephemeral: true });
        return;
      }

      await assignHqPosition(
        interaction,
        position,
        target,
        "❌ Level 3 이상만 사령본부 수정이 가능합니다."
      );
      return;
    }

    if (interaction.commandName === "단수뇌부추가") {
      const unitName = interaction.options.getString("단", true);
      const position = interaction.options.getString("직책", true);
      const targetUser = interaction.options.getUser("대상", true);
      const target = await safeFetchMember(guild, targetUser.id);

      if (!target) {
        await reply(interaction, { content: "❌ 대상을 찾을 수 없습니다.", ephemeral: true });
        return;
      }

      if (!(UNIT_COMMAND_POSITIONS[unitName] || []).includes(position)) {
        await reply(interaction, {
          content: `❌ ${unitName}에 배치할 수 없는 직책입니다. 해당 단에 맞는 직책을 선택해주세요.`,
          ephemeral: true,
        });
        return;
      }

      await assignHqPosition(
        interaction,
        position,
        target,
        `❌ Level 3 이상만 ${unitName} 수정이 가능합니다.`
      );
      return;
    }

    if (interaction.commandName === "편제삭제") {
      const targetUser = interaction.options.getUser("대상", true);
      const userLevel = await getExecutorLevel(interaction, guild);

      if (userLevel < 2) {
        await reply(interaction, { content: "❌ 사령본부 이상만 사용 가능합니다.", ephemeral: true });
        return;
      }

      const removed = removeUserFromOrganization(targetUser.id);
      await persistAndRefresh(guild);

      await reply(interaction, {
        content: removed
          ? `✅ <@${targetUser.id}> 편제에서 삭제 완료`
          : "해당 인원은 등록되어 있지 않습니다.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName === "권한현황") {
      await reply(interaction, {
        embeds: [buildPermissionEmbed(guild)],
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName === "찾기") {
      const targetUser = interaction.options.getUser("대상", true);

      if (!isRegistered(targetUser.id)) {
        await reply(interaction, {
          content: "해당 인원은 편제에 없습니다.",
          ephemeral: true,
        });
        return;
      }

      await reply(interaction, {
        embeds: buildEmbeds(guild, targetUser.id),
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName === "공지") {
      const channel = interaction.options.getChannel("채널", true);
      const userLevel = await getExecutorLevel(interaction, guild);

      if (userLevel < 2) {
        await reply(interaction, {
          content: "❌ 사령본부 이상만 공지가 가능합니다.",
          ephemeral: true,
        });
        return;
      }

      const msg = await channel.send({
        embeds: buildMainEmbeds(guild),
        components: [buildNoticeButtons()],
      });

      store.공지.messageId = String(msg.id);
      store.공지.channelId = String(channel.id);
      saveData(store);

      await reply(interaction, {
        content: "✅ 편제 공지 생성 완료",
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName === "공지수정") {
      const userLevel = await getExecutorLevel(interaction, guild);

      if (userLevel < 3) {
        await reply(interaction, {
          content: "❌ Level 3 이상만 공지수정이 가능합니다.",
          ephemeral: true,
        });
        return;
      }

      const { channel, message, errorCode } = await fetchNoticeMessage(client);

      if (!channel && !message) {
        await reply(interaction, {
          content: "❌ 등록된 공지가 없습니다.",
          ephemeral: true,
        });
        return;
      }

      if (errorCode === "not_found") {
        store.공지.messageId = null;
        store.공지.channelId = null;
        saveData(store);

        await reply(interaction, {
          content: "❌ 기존 공지를 찾을 수 없어 공지 정보가 초기화되었습니다.",
          ephemeral: true,
        });
        return;
      }

      if (!message) {
        await reply(interaction, {
          content: "❌ 기존 공지를 불러오지 못했습니다.",
          ephemeral: true,
        });
        return;
      }

      try {
        await message.edit({
          embeds: buildMainEmbeds(guild),
          components: [buildNoticeButtons()],
        });

        await reply(interaction, {
          content: "✅ 편제 공지 수정 완료",
          ephemeral: true,
        });
      } catch (err) {
        console.log(`명령 처리 중 오류: ${err}`);
        await reply(interaction, {
          content:
            "❌ 처리 중 오류가 발생했습니다. 봇 역할 위치, Manage Roles 권한, 환경변수를 확인해주세요.",
          ephemeral: true,
        });
      }
      return;
    }
  } catch (err) {
    console.log("❌ interactionCreate 처리 오류:", err);

    if (interaction.isRepliable()) {
      await reply(interaction, {
        content: "❌ 명령 처리 중 오류가 발생했습니다.",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

client.login(TOKEN).catch((err) => {
  console.log(`❌ 시작 실패: ${err}`);
  process.exit(1);
});