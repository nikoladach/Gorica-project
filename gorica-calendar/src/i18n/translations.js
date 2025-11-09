// Translation files for the application

export const translations = {
  mk: {
    // Common
    common: {
      loading: 'Вчитување...',
      error: 'Грешка',
      success: 'Успешно',
      save: 'Зачувај',
      saving: 'Зачувување...',
      cancel: 'Откажи',
      delete: 'Избриши',
      edit: 'Уреди',
      create: 'Креирај',
      update: 'Ажурирај',
      close: 'Затвори',
      search: 'Пребарај',
      filter: 'Филтрирај',
      all: 'Сите',
      yes: 'Да',
      no: 'Не',
      confirm: 'Потврди',
      back: 'Назад',
      next: 'Следно',
      previous: 'Претходно',
    },

    // Authentication
    auth: {
      login: 'Најава',
      logout: 'Одјава',
      username: 'Корисничко име',
      password: 'Лозинка',
      loginTitle: 'Горица Планирач',
      pleaseLogin: 'Ве молиме најавете се за да продолжите',
      enterUsername: 'Внесете корисничко име',
      enterPassword: 'Внесете лозинка',
      loggingIn: 'Најавување...',
      loginFailed: 'Најавата не успеа. Ве молиме обидете се повторно.',
      invalidCredentials: 'Невалидно корисничко име или лозинка',
      loggedInAs: 'Најавени како:',
      demoCredentials: 'Демо акредитиви:',
      doctor: 'Доктор',
      esthetician: 'Естетичар',
    },

    // Appointments
    appointments: {
      title: 'Термин',
      newAppointment: 'Нов термин',
      editAppointment: 'Уреди термин',
      appointmentType: 'Тип на термин',
      selectType: 'Изберете тип',
      patientName: 'Име на пациент',
      patientNameRequired: 'Името на пациентот е задолжително',
      patientPhone: 'Телефонски број',
      notes: 'Белешки / Причина за посета',
      notesPlaceholder: 'Дополнителни белешки или причина за посета',
      date: 'Датум',
      time: 'Време',
      status: 'Статус',
      scheduled: 'Закажан',
      completed: 'Завршен',
      cancelled: 'Откажан',
      cancelAppointment: 'Откажи термин',
      cancelConfirm: 'Дали сте сигурни дека сакате да го откажете овој термин?',
      saveAppointment: 'Зачувај термин',
      failedToSave: 'Не успеа да се зачува терминот. Ве молиме обидете се повторно.',
      failedToCancel: 'Не успеа да се откаже терминот. Ве молиме обидете се повторно.',
      typeRequired: 'Типот на терминот е задолжителен',
      available: 'Достапно',
      booked: 'Резервирано',
      clickToEdit: 'Кликнете за уредување',
      noAppointments: 'Нема термини за денес',
      totalAppointments: 'Вкупно термини денес',
      appointments: 'Термини',
      loadingAppointments: 'Вчитување термини...',
      previous: 'Претходно',
      next: 'Следно',
    },

    // Calendar
    calendar: {
      day: 'Ден',
      week: 'Недела',
      month: 'Месец',
      today: 'Денес',
      schedule: 'Распоред',
      todaySchedule: 'Денешен распоред',
      scheduleFor: 'Распоред за',
      morning: 'Утро',
      evening: 'Вечер',
      showingDoctorOnly: 'Прикажување само на термините на докторот',
      showingEstheticianOnly: 'Прикажување само на термините на естетичарот',
      more: 'повеќе',
      monday: 'Понеделник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четврток',
      friday: 'Петок',
      saturday: 'Сабота',
      sunday: 'Недела',
      mondayShort: 'Пон',
      tuesdayShort: 'Вто',
      wednesdayShort: 'Сре',
      thursdayShort: 'Чет',
      fridayShort: 'Пет',
      saturdayShort: 'Саб',
      sundayShort: 'Нед',
      months: {
        january: 'јануари',
        february: 'февруари',
        march: 'март',
        april: 'април',
        may: 'мај',
        june: 'јуни',
        july: 'јули',
        august: 'август',
        september: 'септември',
        october: 'октомври',
        november: 'ноември',
        december: 'декември',
      },
    },

    // Navigation
    nav: {
      dayView: 'Дневен преглед',
      weekView: 'Неделен преглед',
      monthView: 'Месечен преглед',
    },

    // Sidebar
    sidebar: {
      searchPatient: 'Пребарај пациент',
      searchPlaceholder: 'Пребарај по име на пациент...',
      filterByType: 'Филтрирај по тип',
      allTypes: 'Сите типови',
      openSidebar: 'Отвори странична лента',
    },

    // Header
    header: {
      doctorScheduler: 'Распоред на доктор',
      estheticianScheduler: 'Распоред на естетичар',
      searchPatientName: 'Пребарај име на пациент...',
    },

    // Errors
    errors: {
      refreshPage: 'Ве молиме освежете ја страницата или проверете ја вашата врска.',
      authenticationRequired: 'Потребна е автентификација. Ве молиме најавете се повторно.',
      networkError: 'Грешка во мрежата',
      unknownError: 'Непозната грешка',
    },

    // Appointment Types
    appointmentTypes: {
      // Doctor types
      consultation: 'Консултација',
      'follow-up': 'Контролен преглед',
      checkup: 'Преглед',
      procedure: 'Процедура',
      emergency: 'Итно',

      // Esthetician types
      facial: 'Фацијална третман',
      laser: 'Ласерска третман',
      wax: 'Депилација',
    },

    // Search Results
    search: {
      searchResults: 'Резултати од пребарувањето за',
      found: 'Пронајдено',
      appointment: 'термин',
      appointments: 'термини',
      noResults: 'Нема пронајдено термини за',
    },

    // Status
    status: {
      scheduled: 'Закажан',
      completed: 'Завршен',
      cancelled: 'Откажан',
    },

    // Reports
    reports: {
      physicianReport: 'Извештај од лекар',
      appointmentInfo: 'Информации за терминот',
      patientName: 'Име на пациент',
      dateOfBirth: 'Датум на раѓање',
      date: 'Датум',
      time: 'Време',
      appointmentType: 'Тип на термин',
      reasonForVisit: 'Причина за посета',
      chiefComplaint: 'Главна жалба',
      historyOfPresentIllness: 'Историја на сегашната болест',
      physicalExamination: 'Физички преглед',
      diagnosis: 'Дијагноза',
      treatmentPlan: 'План за третман',
      medicationsPrescribed: 'Пропишани лекови',
      followUpInstructions: 'Инструкции за следен преглед',
      additionalNotes: 'Дополнителни белешки',
      appointmentRequired: 'Терминот е задолжителен',
      savedSuccessfully: 'Извештајот е успешно зачуван',
      failedToSave: 'Не успеа да се зачува извештајот',
      openReport: 'Отвори извештај',
      createReport: 'Креирај извештај',
      saveAsPDF: 'Зачувај како PDF',
      notSpecified: 'Не е наведено',
      pdfGenerated: 'PDF извештајот е успешно генериран',
      failedToGeneratePDF: 'Не успеа да се генерира PDF',
      patientReports: 'Извештаи за пациент',
      noReports: 'Нема извештаи за овој пациент',
      viewReport: 'Види извештај',
      failedToLoad: 'Не успеа да се вчитаат извештаите',
      patientIdRequired: 'Потребен е ID на пациентот за да се вчитаат извештаите',
    },
  },
};

// Default language
export const defaultLanguage = 'mk';

// Get translation function
export const getTranslation = (key, language = defaultLanguage) => {
  const keys = key.split('.');
  let value = translations[language];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to key if translation not found
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
};

// Translation hook (simple version)
export const useTranslation = (language = defaultLanguage) => {
  const t = (key) => getTranslation(key, language);
  return { t, language };
};

