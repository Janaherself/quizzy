export type Language = 'en' | 'ar';

export type TranslationKey = keyof typeof translations['en'];

export const defaultLanguage: Language = 'en';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // App
    appTitle: 'Quizzy',
    appTitleArabic: 'Quizzy',

    // Navigation
    nav_dashboard: 'Dashboard',
    nav_myQuizzes: 'My Quizzes',
    nav_logout: 'Logout',

    // Login
    login_welcome: 'Welcome to Quizzy',
    login_subtitle: 'Log in to continue',
    login_teacher: 'Teacher',
    login_student: 'Student',
    login_email: 'Email',
    login_emailPlaceholder: 'example@quizzy.local',
    login_password: 'Password',
    login_passwordPlaceholder: '••••••••',
    login_submit: 'Log In',
    login_loading: 'Logging in...',
    login_error: 'Login failed. Check your credentials.',

    // Teacher Dashboard
    teacher_myQuizzes: 'My Quizzes',
    teacher_newQuiz: 'New Quiz',
    teacher_loadError: 'Failed to load quizzes.',
    teacher_emptyTitle: "You haven't created any quizzes yet.",
    teacher_emptyAction: 'Create Your First Quiz',
    teacher_editQuiz: 'Edit',
    teacher_results: 'Results',

    // Student Dashboard
    student_myQuizzes: 'Available Quizzes',
    student_loadError: 'Failed to load quizzes.',
    student_emptyTitle: 'No quizzes available right now.',
    student_startQuiz: 'Start Quiz',
    student_resume: 'Resume',
    student_viewResult: 'View Result',
    student_notYetAvailable: 'Not yet available',
    student_alreadySubmitted: 'Already submitted',
    student_submittedHint: 'You can only submit this quiz once.',
    student_viewResultLink: 'View result',

    // Quiz Editor
    quizEditor_createNew: 'Create New Quiz',
    quizEditor_edit: 'Edit Quiz',
    quizEditor_loadError: 'Failed to load quiz.',
    quizEditor_loadingClasses: 'Loading classes...',
    quizEditor_loadClassesError: 'Failed to load classes.',
    quizEditor_quizSettings: 'Quiz Settings',
    quizEditor_title: 'Title',
    quizEditor_titlePlaceholder: 'Quiz title',
    quizEditor_description: 'Description (optional)',
    quizEditor_descriptionPlaceholder: 'Brief description of the quiz...',
    quizEditor_startTime: 'Start Time',
    quizEditor_endTime: 'End Time',
    quizEditor_duration: 'Duration (minutes)',
    quizEditor_negativeMarking: 'Enable Negative Marking',
    quizEditor_targetClasses: 'Target Classes',
    quizEditor_saving: 'Saving...',
    quizEditor_createButton: 'Create Quiz',
    quizEditor_saveButton: 'Save Changes',
    quizEditor_saveSuccess: 'Quiz saved.',
    quizEditor_saveError: 'Failed to save quiz.',
    quizEditor_publish: 'Publish Quiz',
    quizEditor_publishSuccess: 'Quiz published.',
    quizEditor_publishError: 'Failed to publish quiz.',
    quizEditor_extendDeadline: 'Extend Deadline',
    quizEditor_currentDeadline: 'Current deadline:',
    quizEditor_newDeadline: 'New deadline',
    quizEditor_extendHint: 'The new deadline must be later than the current one.',
    quizEditor_extendSuccess: 'Deadline extended.',
    quizEditor_extendError: 'Failed to extend deadline.',
    quizEditor_extendAction: 'Extend',
    quizEditor_cancel: 'Cancel',
    quizEditor_publishedLocked: 'This quiz has been published and can no longer be edited.',
    quizEditor_questions: 'Questions',
    quizEditor_questionsCount: 'Questions ({count})',
    quizEditor_addQuestion: '+ Add Question',
    quizEditor_noQuestions: 'No questions yet.',
    quizEditor_addQuestionsHint: 'Add questions to the quiz. The quiz must have at least one question to be published.',

    quizEditor_editQuestion: 'Edit',
    quizEditor_pointsShort: '{count} pts',
    quizEditor_choicesShort: '{count} choices',
    quizEditor_correctLabel: 'Correct:',

    quizEditor_questionSaved: 'Question saved.',
    quizEditor_questionSaveError: 'Failed to save question.',
    quizEditor_questionUpdated: 'Question updated.',
    quizEditor_questionUpdateError: 'Failed to update question.',
    quizEditor_loadQuestionsError: 'Failed to load questions.',

    // Quiz Editor validation
    quizEditor_validation_titleRequired: 'Title is required.',
    quizEditor_validation_datesOrder: 'Start time must be before end time.',
    quizEditor_validation_targetClassRequired: 'Please select at least one class.',

    // Question Editor
    qe_questionText: 'Question Text',
    qe_questionPlaceholder: 'Write your question here...',
    qe_points: 'Points',
    qe_choices: 'Choices ({count}/6)',
    qe_choicePlaceholder: 'Choice {index}',
    qe_removeChoice: 'Remove choice',
    qe_addChoice: 'Add Choice',
    qe_cancel: 'Cancel',
    qe_saving: 'Saving...',
    qe_update: 'Update',
    qe_add: 'Add',

    // Quiz Take (student)
    quizTake_loadError: 'Failed to load quiz.',
    quizTake_startQuiz: 'Start Quiz',
    quizTake_cancel: 'Cancel',
    quizTake_timerNote: 'The timer starts when you click "Start Quiz".',
    quizTake_duration: 'Quiz duration: {duration} minutes',
    quizTake_negativeMarking: 'Negative marking enabled',
    quizTake_questionsCount: '{count} questions',
    quizTake_answered: '{count} / {total} answered',
    quizTake_timeUp: "Time's up! Your answers are being submitted automatically.",
    quizTake_startError: 'Failed to start quiz.',
    quizTake_alreadySubmitted: 'The quiz has already been submitted.',
    quizTake_submitError: 'Failed to submit quiz.',
    quizTake_submitting: 'Submitting...',
    quizTake_finishSubmit: 'Finish and Submit Quiz',
    quizTake_loading: 'Loading quiz...',

    // Quiz Result (student)
    quizResult_loadError: 'Failed to load result.',
    quizResult_score: 'Score',
    quizResult_statusLabel: 'Status:',
    quizResult_completed: 'Completed',
    quizResult_inProgress: 'In Progress',
    quizResult_answerDetails: 'Answer Details',
    quizResult_notAnswered: 'Not answered',
    quizResult_correct: 'Correct',
    quizResult_incorrect: 'Incorrect',
    quizResult_points: 'Points:',
    quizResult_yourAnswer: 'Your answer:',
    quizResult_correctAnswer: 'Correct answer:',
    quizResult_backToQuizzes: 'Back to My Quizzes',

    // Teacher Quiz Results
    teacherResults_loadError: 'Failed to load results.',
    teacherResults_title: 'Results',
    teacherResults_back: 'Back',
    teacherResults_noResults: 'No student has submitted this quiz yet.',
    teacherResults_table_student: 'Student',
    teacherResults_table_email: 'Email',
    teacherResults_table_class: 'Class',
    teacherResults_table_score: 'Score',
    teacherResults_table_max: 'Max',
    teacherResults_table_time: 'Time',
    teacherResults_table_status: 'Status',
    teacherResults_completed: 'Completed',
    teacherResults_inProgress: 'In Progress',

    // Status badges
    status_draft: 'Draft',
    status_upcoming: 'Upcoming',
    status_live: 'Live',
    status_closed: 'Closed',
    status_completed: 'Completed',
    status_inProgress: 'In Progress',

    // Quiz Card
    quizCard_questions: '{count} questions',
    quizCard_minutes: '{duration} min',
    quizCard_class: '{count} class|{count} classes',
    quizCard_negativeMarking: 'Negative marking',
    quizCard_closed: 'Quiz closed',
    quizCard_quizClosed: 'Quiz closed',
    quizCard_noStartButton: 'There is no Start button.',

    // Quiz Take - ready screen items
    quizTake_info_questionCount: '{count} question',
    quizTake_info_questionCount_plural: '{count} questions',
    quizTake_info_duration: 'Quiz duration: {duration} minutes',
    quizTake_info_negativeMarking: 'Negative marking enabled',
    quizTake_info_timerStarts: 'The timer starts when you press "Start Quiz".',

    // Timer
    timer_timeUp: "Time's up",
    timer_timeRemaining: 'Time remaining',

    // Quiz visibility states
    quizState_upcoming: 'Upcoming',
    quizState_alreadySubmitted: 'Already submitted',
    quizState_closed: 'Closed',
    quizState_active: 'Active',
    quizState_notAvailable: 'Not available',

    // Toast / notification
    toast_success: 'Success',
    toast_error: 'Error',

    // Language toggle
    lang_arabic: 'Arabic',
    lang_english: 'English',
    lang_toggleHint: 'Switch language',
  },

  ar: {
    // App
    appTitle: 'Quizzy',
    appTitleArabic: 'كويزي',

    // Navigation
    nav_dashboard: 'لوحة التحكم',
    nav_myQuizzes: 'كويزاتي',
    nav_logout: 'خروج',

    // Login
    login_welcome: 'مرحباً بك في Quizzy',
    login_subtitle: 'سجّل دخلك للمتابعة',
    login_teacher: 'معلم',
    login_student: 'طالب',
    login_email: 'البريد الإلكتروني',
    login_emailPlaceholder: 'example@quizzy.local',
    login_password: 'كلمة المرور',
    login_passwordPlaceholder: '••••••••',
    login_submit: 'دخول',
    login_loading: 'جارٍ تسجيل الدخول...',
    login_error: 'فشل تسجيل الدخول. تحقق من بيانات الاعتماد.',

    // Teacher Dashboard
    teacher_myQuizzes: 'كويزاتي',
    teacher_newQuiz: 'اختبار جديد',
    teacher_loadError: 'تعذر تحميل الكويزات.',
    teacher_emptyTitle: 'لم تقم بعد بإنشاء أي كويزات.',
    teacher_emptyAction: 'إنشاء أول اختبار',
    teacher_editQuiz: 'تعديل',
    teacher_results: 'النتائج',

    // Student Dashboard
    student_myQuizzes: 'الكويزات المتاحة',
    student_loadError: 'تعذر تحميل الكويزات.',
    student_emptyTitle: 'لا توجد كويزات متاحة حالياً.',
    student_startQuiz: 'ابدأ الاختبار',
    student_resume: 'استكمل',
    student_viewResult: 'النتيجة',
    student_notYetAvailable: 'غير متاح بعد',
    student_alreadySubmitted: 'تم التقديم بالفعل',
    student_submittedHint: 'يمكنك إرسال هذا الاختبار مرة واحدة فقط.',
    student_viewResultLink: 'عرض النتيجة',

    // Quiz Editor
    quizEditor_createNew: 'إنشاء اختبار جديد',
    quizEditor_edit: 'تحرير الاختبار',
    quizEditor_loadError: 'تعذر تحميل الاختبار.',
    quizEditor_loadingClasses: 'جارٍ تحميل الفصول...',
    quizEditor_loadClassesError: 'تعذر تحميل الفصول.',
    quizEditor_quizSettings: 'إعدادات الاختبار',
    quizEditor_title: 'العنوان',
    quizEditor_titlePlaceholder: 'عنوان الاختبار',
    quizEditor_description: 'الوصف (اختياري)',
    quizEditor_descriptionPlaceholder: 'وصف موجز للاختبار...',
    quizEditor_startTime: 'وقت البدء',
    quizEditor_endTime: 'وقت النهاية',
    quizEditor_duration: 'المدة (دقيقة)',
    quizEditor_negativeMarking: 'تفعيل التصحيح السلبي',
    quizEditor_targetClasses: 'الفصول المستهدفة',
    quizEditor_saving: 'جارٍ الحفظ...',
    quizEditor_createButton: 'إنشاء الاختبار',
    quizEditor_saveButton: 'حفظ التغييرات',
    quizEditor_saveSuccess: 'تم حفظ الاختبار.',
    quizEditor_saveError: 'تعذر حفظ الاختبار.',
    quizEditor_publish: 'نشر الاختبار',
    quizEditor_publishSuccess: 'تم نشر الاختبار.',
    quizEditor_publishError: 'تعذر نشر الاختبار.',
    quizEditor_extendDeadline: 'تمديد الموعد النهائي',
    quizEditor_currentDeadline: 'الموعد الحالي:',
    quizEditor_newDeadline: 'الموعد الجديد',
    quizEditor_extendHint: 'يجب أن يكون الموعد الجديد أبعد من الموعد الحالي.',
    quizEditor_extendSuccess: 'تم تمديد الموعد النهائي.',
    quizEditor_extendError: 'تعذر تمديد الموعد.',
    quizEditor_extendAction: 'تمديد',
    quizEditor_cancel: 'إلغاء',
    quizEditor_publishedLocked: 'تم نشر هذا الاختبار؟ لا يمكن تعديل المحتوى الآن.',
    quizEditor_questions: 'الأسئلة',
    quizEditor_questionsCount: 'الأسئلة ({count})',
    quizEditor_addQuestion: '+ إضافة سؤال',
    quizEditor_noQuestions: 'لا توجد أسئلة.',
    quizEditor_addQuestionsHint: 'أضف أسئلة للاختبار. الاختبار يجب أن يحتوي على سؤال واحد على الأقل للنشر.',

    quizEditor_editQuestion: 'تعديل',
    quizEditor_pointsShort: '{count} نقطة',
    quizEditor_choicesShort: '{count} خيارات',
    quizEditor_correctLabel: 'الصحيح:',

    quizEditor_questionSaved: 'تم حفظ السؤال.',
    quizEditor_questionSaveError: 'تعذر حفظ السؤال.',
    quizEditor_questionUpdated: 'تم تحديث السؤال.',
    quizEditor_questionUpdateError: 'تعذر تحديث السؤال.',
    quizEditor_loadQuestionsError: 'تعذر تحميل الأسئلة.',

    // Quiz Editor validation
    quizEditor_validation_titleRequired: 'العنوان مطلوب.',
    quizEditor_validation_datesOrder: 'وقت البدء يجب أن يكون قبل وقت النهاية.',
    quizEditor_validation_targetClassRequired: 'يجب تحديد فصل واحد على الأقل.',

    // Question Editor
    qe_questionText: 'نص السؤال',
    qe_questionPlaceholder: 'اكتب نص السؤال هنا...',
    qe_points: 'العلامة',
    qe_choices: 'الخيارات ({count}/6)',
    qe_choicePlaceholder: 'خيار {index}',
    qe_removeChoice: 'إزالة الخيار',
    qe_addChoice: 'إضافة خيار',
    qe_cancel: 'إلغاء',
    qe_saving: 'جارٍ الحفظ...',
    qe_update: 'تحديث',
    qe_add: 'إضافة',

    // Quiz Take (student)
    quizTake_loadError: 'تعذر تحميل الاختبار.',
    quizTake_startQuiz: 'إبدأ الاختبار',
    quizTake_cancel: 'إلغاء',
    quizTake_timerNote: 'الوقت يبدأ عند الضغط على "إبدأ الاختبار".',
    quizTake_duration: 'مدة الاختبار: {duration} دقيقة',
    quizTake_negativeMarking: 'تفعيل التصحيح السلبي',
    quizTake_questionsCount: '{count} سؤال',
    quizTake_answered: '{count} / {total} مجاوبة',
    quizTake_timeUp: 'انتهى الوقت! يتم إرسال إجاباتك تلقائياً.',
    quizTake_startError: 'تعذر بدء الاختبار.',
    quizTake_alreadySubmitted: 'انتهت الإجابة مرسلة بالفعل.',
    quizTake_submitError: 'تعذر إرسال الاختبار.',
    quizTake_submitting: 'جارٍ الإرسال...',
    quizTake_finishSubmit: 'إنهاء وإرسال الاختبار',
    quizTake_loading: 'جارٍ تحميل الاختبار...',

    // Quiz Result (student)
    quizResult_loadError: 'تعذر تحميل النتيجة.',
    quizResult_score: 'النتيجة',
    quizResult_statusLabel: 'الحالة:',
    quizResult_completed: 'مكتمل',
    quizResult_inProgress: 'جارٍ الإنجاز',
    quizResult_answerDetails: 'تفاصيل الإجابة',
    quizResult_notAnswered: 'لم تُجيب',
    quizResult_correct: 'صحيح',
    quizResult_incorrect: 'خطأ',
    quizResult_points: 'النقاط:',
    quizResult_yourAnswer: 'إجابتك:',
    quizResult_correctAnswer: 'الصحيح:',
    quizResult_backToQuizzes: 'العودة إلى كويزاتي',

    // Teacher Quiz Results
    teacherResults_loadError: 'تعذر تحميل النتائج.',
    teacherResults_title: 'النتائج',
    teacherResults_back: 'رجوع',
    teacherResults_noResults: 'لم يقدم أي طالب هذا الاختبار بعد.',
    teacherResults_table_student: 'الطالب',
    teacherResults_table_email: 'البريد الإلكتروني',
    teacherResults_table_class: 'الفصل',
    teacherResults_table_score: 'النقاط',
    teacherResults_table_max: 'الحد الأقصى',
    teacherResults_table_time: 'الوقت',
    teacherResults_table_status: 'الحالة',
    teacherResults_completed: 'مكتمل',
    teacherResults_inProgress: 'جارٍ الإنجاز',

    // Status badges
    status_draft: 'مسودة',
    status_upcoming: 'قريباً',
    status_live: 'نشط',
    status_closed: 'مغلق',
    status_completed: 'مكتمل',
    status_inProgress: 'جارٍ الإنجاز',

    // Quiz Card
    quizCard_questions: '{count} سؤال',
    quizCard_minutes: '{duration} دقيقة',
    quizCard_class: '{count} فصل',
    quizCard_negativeMarking: 'تصحيح سلبي',
    quizCard_closed: 'مغلق',
    quizCard_quizClosed: 'الاختبار مغلق',
    quizCard_noStartButton: 'لا يوجد زر بدء.',

    // Timer
    timer_timeUp: 'انتهى الوقت',
    timer_timeRemaining: 'الوقت المتبقي',

    // Quiz visibility states
    quizState_upcoming: 'قريباً',
    quizState_alreadySubmitted: 'تم التقديم بالفعل',
    quizState_closed: 'مغلق',
    quizState_active: 'نشط',
    quizState_notAvailable: 'غير متاح',

    // Toast / notification
    toast_success: 'نجح',
    toast_error: 'خطأ',

    // Language toggle
    lang_arabic: 'العربية',
    lang_english: 'الإنجليزية',
    lang_toggleHint: 'تبديل اللغة',
  },
};
