import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav: {
        demonList: "Demon List",
        futureList: "Future List",
        players: "Players",
        statistics: "Statistics",
        submit: "Submit",
        faq: "FAQ",
      },
      home: {
        title: "The Pinnacle of Geometry Dash",
        subtitle: "Explore the top verified extreme demons, track the best players, and submit your own records to the TMG List.",
        viewDemonList: "View Demon List",
        submitRecord: "Submit Record",
        latestAdditions: "Latest Additions",
        globalCommunity: "Global Community",
        stats: {
          totalCompletions: "Total Completions",
          activePlayers: "Active Players",
          submissions: "Submissions",
          liveUpdates: "Live Updates"
        }
      },
      levels: {
        title: "Demon List",
        subtitle: "The most difficult completed challenges.",
        search: "Search levels...",
        rank: "Rank",
        levelName: "Level Name",
        creatorVerifier: "Creator / Verifier",
        creator: "Creator",
        points: "Points",
        victors: "Victors",
        status: "Status",
        active: "Active",
        inactive: "Inactive",
        noMatch: "No levels found matching",
        pointsLabel: "Points",
        publisher: "Publisher",
        levelInfo: "Level Info",
        description: "Description",
        verificationVideo: "Verification Video",
        recordSubmissions: "Record Submissions",
        submitRecord: "Submit a Record",
        table: {
          player: "Player",
          progress: "Progress",
          date: "Date",
          proof: "Proof"
        }
      },
      players: {
        title: "Player Leaderboard",
        subtitle: "Tracking the most skilled players in the game.",
        search: "Search players...",
        rank: "Rank",
        player: "Player",
        hardestDemon: "Hardest Demon",
        points: "Points",
        completions: "Completions",
        extremeDemon: "Extreme Demon",
        noMatch: "No players found matching",
        globalRank: "Global Rank",
        totalPoints: "Total Points",
        recentCompletions: "Recent Completions",
        playerStats: "Player Stats",
        daysAgo: "{{count}} days ago"
      },
      statistics: {
        title: "Global Statistics",
        subtitle: "Tracking list progression, player activity, and global demographics.",
        totalCompletions: "Total Completions",
        activeCountries: "Active Countries",
        levelsRanked: "Levels Ranked",
        totalPlayers: "Total Players",
        pointsDistribution: "Player Points Distribution"
      },
      submit: {
        title: "Submit a Record",
        subtitle: "Achieved something great? Let everyone know.",
        username: "Username",
        usernamePlaceholder: "Your geometry dash name",
        levelName: "Level Name",
        levelNamePlaceholder: "e.g. Sonic Wave",
        progress: "Progress (%)",
        videoProof: "Video Proof (YouTube Link)",
        videoProofPlaceholder: "https://youtube.com/watch?v=...",
        submitBtn: "Submit for Review"
      },
      faq: {
        title: "Frequently Asked Questions",
        subtitle: "Everything you need to know about the TMG List.",
        q1: "What is the TMG List?",
        a1: "The TMG List is a leaderboard ranking the hardest verified levels in Geometry Dash, along with the players who have completed them.",
        q2: "How do I get points?",
        a2: "Points are awarded by completing levels on the list. Harder levels give more points.",
        q3: "What are the rules for submitting a record?",
        a3: "You must provide full, uncut video proof of your completion with clicks/taps audible. Cheat indicators like Megahack must be visible if used.",
        q4: "How is difficulty determined?",
        a4: "Difficulty is determined by our team of experienced players and verifiers, who playtest levels and compare them to the current rankings."
      },
      admin: {
        title: "Admin Dashboard",
        accessDenied: "Access Denied",
        accessDeniedMessage: "You do not have administrative privileges.",
        signOut: "Sign out",
        tabs: {
          levels: "Levels",
          future: "Future List",
          verifiers: "Verifiers",
          submissions: "Submissions",
          users: "Users",
          logs: "Logs",
          changelog: "Changelog"
        },
        levels: {
          addButton: "+ Add New Level",
          importJSON: "Import JSON",
          syncSheets: "Sync from Google Sheets",
          fixRanks: "Fix Ranks & Points",
          fixing: "Fixing...",
          rank: "Rank",
          name: "Name",
          creatorVerifier: "Creator / Verifier",
          points: "Points",
          active: "Active",
          actions: "Actions",
          activeStatus: "ACTIVE",
          inactiveStatus: "INACTIVE",
          edit: "Edit",
          delete: "Delete",
          noItems: "No levels found. Try clicking 'Sync from Data Sheet'."
        },
        future: {
          addButton: "+ Add Future Level",
          importJSON: "Import JSON",
          name: "Name",
          creatorVerifier: "Creator / Verifier",
          status: "Status",
          actions: "Actions",
          noItems: "No future levels found."
        },
        verifiers: {
          addButton: "+ Add New Verifier",
          id: "ID",
          name: "Name",
          actions: "Actions",
          noItems: "No verifiers found."
        },
        submissions: {
          date: "Date",
          user: "User",
          level: "Level",
          progress: "Progress",
          status: "Status",
          video: "Video",
          actions: "Actions",
          link: "Link",
          accept: "Accept",
          reject: "Reject",
          delete: "Delete",
          noItems: "No record submissions found."
        },
        users: {
          title: "User Roles & Profiles",
          subtitle: "Manage user roles dynamically. Changes take effect instantly across the application.",
          searchPlaceholder: "Search by username...",
          profileId: "Profile ID",
          details: "User Details",
          gdUsernameCountry: "GD Username / Country",
          claimedBy: "Claimed By",
          currentRole: "Current Role",
          noDescription: "No description",
          na: "N/A",
          claimed: "Claimed:",
          unclaimed: "Unclaimed",
          user: "User",
          moderator: "Moderator",
          elderModer: "Elder Moder",
          admin: "Admin"
        },
        logs: {
          title: "Moderation Action Logs",
          subtitle: "Audit log of all actions taken by list coordinators and moderators.",
          refresh: "Refresh Logs",
          timestamp: "Timestamp",
          moderator: "Moderator",
          action: "Action",
          details: "Details",
          noItems: "No moderator logs available."
        },
        changelog: {
          addButton: "+ Add Changelog",
          date: "Date",
          content: "Content",
          actions: "Actions",
          noItems: "No changelog entries found."
        },
        modal: {
          editLevel: "Edit Level",
          newLevel: "New Level",
          id: "ID",
          gdId: "Geometry Dash ID",
          rank: "Rank",
          points: "Points",
          name: "Name",
          difficulty: "Difficulty",
          creator: "Creator",
          verifier: "Verifier",
          victors: "Victors",
          videoUrl: "Video URL / #",
          preview: "Level Preview (Thumbnail)",
          compressing: "Compressing..."
        }
      },
      common: {
        loading: "Loading..."
      },
      navbar: {
        adminDashboard: "Admin Dashboard",
        notifications: "Notifications"
      },
      notifications: {
        title: "Notifications",
        markAllAsRead: "Mark all as read",
        noNotifications: "No notifications yet."
      }
    }
  },
  ru: {
    translation: {
      nav: {
        demonList: "Топы",
        futureList: "Будущий Лист",
        players: "Игроки",
        statistics: "Статистика",
        submit: "Отправить рекорд",
        faq: "FAQ",
      },
      home: {
        title: "Вершина мастерства в Geometry Dash",
        subtitle: "Следите за самыми сложными верифицированными уровнями, рейтингом сильнейших игроков и отправляйте свои собственные рекорды.",
        viewDemonList: "Открыть Топы",
        submitRecord: "Отправить рекорд",
        latestAdditions: "Недавние добавления",
        globalCommunity: "Глобальное сообщество",
        stats: {
          totalCompletions: "Всего прохождений",
          activePlayers: "Активных игроков",
          submissions: "Отправлено рекордов",
          liveUpdates: "Регулярные обновления"
        }
      },
      levels: {
        title: "Топы",
        subtitle: "Список самых сложных и красивых уровней на данный момент.",
        search: "Поиск уровней...",
        rank: "Топ",
        levelName: "Название",
        creatorVerifier: "Креатор / Верифаер",
        creator: "Создатель",
        points: "Очки",
        victors: "Викторы",
        status: "Статус",
        active: "В топе",
        inactive: "В архиве",
        noMatch: "По вашему запросу уровней не найдено",
        pointsLabel: "Очков",
        publisher: "Выложил",
        levelInfo: "Информация об уровне",
        description: "Описание",
        verificationVideo: "Видео верификации (Пруф)",
        recordSubmissions: "Подтвержденные рекорды",
        submitRecord: "Отправить свой рекорд",
        table: {
          player: "Игрок",
          progress: "Прогресс",
          date: "Дата",
          proof: "Пруф"
        }
      },
      players: {
        title: "Рейтинг Игроков",
        subtitle: "Отслеживание самых скилловых игроков нашего сервера.",
        search: "Поиск игроков...",
        rank: "Место",
        player: "Игрок",
        hardestDemon: "Хардест",
        points: "Очки",
        completions: "Прохождения",
        extremeDemon: "Extreme Demon",
        noMatch: "По вашему запросу игроков не найдено",
        globalRank: "Глобальный топ",
        totalPoints: "Всего очков",
        recentCompletions: "Недавние прохождения",
        playerStats: "Статистика игрока",
        daysAgo: "{{count}} дн. назад"
      },
      statistics: {
        title: "Глобальная Статистика",
        subtitle: "Отслеживание прогресса всего листа, активности игроков и общей демографии.",
        totalCompletions: "Всего прохождений",
        activeCountries: "Активных стран",
        levelsRanked: "Уровней в рейтинге",
        totalPlayers: "Всего игроков",
        pointsDistribution: "Распределение очков среди игроков"
      },
      submit: {
        title: "Отправить рекорд",
        subtitle: "Прошли уровень из топа или поставили хороший прогресс? Загружайте видео пруф сюда.",
        username: "Никнейм",
        usernamePlaceholder: "Ваш никнейм в Geometry Dash",
        levelName: "Название уровня",
        levelNamePlaceholder: "напр. Sonic Wave",
        progress: "Прогресс (%)",
        videoProof: "Ссылка на видео (YouTube)",
        videoProofPlaceholder: "https://youtube.com/watch?v=...",
        submitBtn: "Отправить на проверку"
      },
      faq: {
        title: "Часто задаваемые вопросы",
        subtitle: "Все, что вам нужно знать о работе нашего Топа (Листа).",
        q1: "Что такое вообще этот Топ?",
        a1: "Это таблица лидеров, в которой собраны самые сложные уровни в Geometry Dash и лучшие игроки, соревнующиеся в их прохождении.",
        q2: "Как получить очки?",
        a2: "Очки начисляются за прохождение уровней из списка или за определенный процент прогресса на них. Чем сложнее уровень — тем больше очков вы получите.",
        q3: "Какие правила для отправки рекорда?",
        a3: "Вам необходимо приложить полное, необрезанное видеодоказательство вашего прохождения со слышимыми кликами (нажатиями). Если вы играете с модами (Megahack), чит-индикаторы должны быть обязательно выведены на экран.",
        q4: "Как определяется сложность новых уровней?",
        a4: "Сложность оценивается нашей командой опытных верифаеров и игроков, которые тестируют уровни на практике и сравнивают их с уже расставленным топом."
      },
      admin: {
        title: "Админ Панель",
        accessDenied: "Доступ запрещён",
        accessDeniedMessage: "У вас нет административных прав.",
        signOut: "Выйти",
        tabs: {
          levels: "Уровни",
          future: "Будущий Лист",
          verifiers: "Верифаеры",
          submissions: "Рекорды",
          users: "Пользователи",
          logs: "Логи",
          changelog: "Ченджлог"
        },
        levels: {
          addButton: "+ Добавить уровень",
          importJSON: "Импорт JSON",
          syncSheets: "Синхронизировать из Google Sheets",
          fixRanks: "Исправить ранги и очки",
          fixing: "Исправление...",
          rank: "Ранг",
          name: "Название",
          creatorVerifier: "Креатор / Верифаер",
          points: "Очки",
          active: "Активно",
          actions: "Действия",
          activeStatus: "АКТИВЕН",
          inactiveStatus: "НЕАКТИВЕН",
          edit: "Редактировать",
          delete: "Удалить",
          noItems: "Уровни не найдены. Попробуйте нажать 'Sync from Data Sheet'."
        },
        future: {
          addButton: "+ Добавить будущий уровень",
          importJSON: "Импорт JSON",
          name: "Название",
          creatorVerifier: "Креатор / Верифаер",
          status: "Статус",
          actions: "Действия",
          noItems: "Будущие уровни не найдены."
        },
        verifiers: {
          addButton: "+ Добавить верифаера",
          id: "ID",
          name: "Имя",
          actions: "Действия",
          noItems: "Верифаеры не найдены."
        },
        submissions: {
          date: "Дата",
          user: "Игрок",
          level: "Уровень",
          progress: "Прогресс",
          status: "Статус",
          video: "Видео",
          actions: "Действия",
          link: "Ссылка",
          accept: "Принять",
          reject: "Отклонить",
          delete: "Удалить",
          noItems: "Рекорды не найдены."
        },
        users: {
          title: "Роли и профили пользователей",
          subtitle: "Управляйте ролями пользователей. Изменения вступают в силу сразу.",
          searchPlaceholder: "Поиск по никнейму...",
          profileId: "ID профиля",
          details: "Пользователь",
          gdUsernameCountry: "GD ник / Страна",
          claimedBy: "Заявлен",
          currentRole: "Текущая роль",
          noDescription: "Нет описания",
          na: "N/A",
          claimed: "Заявлено:",
          unclaimed: "Не заявлено",
          user: "Пользователь",
          moderator: "Модератор",
          elderModer: "Старший модератор",
          admin: "Админ"
        },
        logs: {
          title: "Логи модерации",
          subtitle: "Аудит всех действий координаторов и модераторов.",
          refresh: "Обновить логи",
          timestamp: "Время",
          moderator: "Модератор",
          action: "Действие",
          details: "Детали",
          noItems: "Логи модерации отсутствуют."
        },
        changelog: {
          addButton: "+ Добавить запись",
          date: "Дата",
          content: "Содержимое",
          actions: "Действия",
          noItems: "Записи ченджлога не найдены."
        },
        modal: {
          editLevel: "Редактировать уровень",
          newLevel: "Новый уровень",
          id: "ID",
          gdId: "Geometry Dash ID",
          rank: "Ранг",
          points: "Очки",
          name: "Название",
          difficulty: "Сложность",
          creator: "Создатель",
          verifier: "Верифаер",
          victors: "Прошедшие",
          videoUrl: "Ссылка на видео / #",
          preview: "Превью уровня (миниатюра)",
          compressing: "Сжатие..."
        }
      },
      common: {
        loading: "Загрузка..."
      },
      navbar: {
        adminDashboard: "Админ Панель",
        notifications: "Уведомления"
      },
      notifications: {
        title: "Уведомления",
        markAllAsRead: "Пометить все как прочитанные",
        noNotifications: "Нет уведомлений."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ru", 
    fallbackLng: "ru",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
