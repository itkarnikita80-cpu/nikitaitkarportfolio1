// Source of Truth strictly extracted from Nikita Itkar's verified resume
// No invented details, no fake proficiency bars, strictly confirmed links only

export const personalInfo = {
  name: "Nikita Itkar",
  role: "Computer Science & Engineering Student | Web Designing & Front-End Development",
  heroTagline: "Designing Clean, Thoughtful Digital Experiences.",
  statusBadge: "✦ CSE STUDENT • OPEN TO OPPORTUNITIES",
  bio: "I'm Nikita — a Computer Science and Engineering student passionate about web designing and front-end development, dedicated to creating clean, responsive, user-friendly websites and applying modern web fundamentals.",
  careerObjective: "Computer Science and Engineering student interested in web designing and front-end development. Eager to create clean, responsive, user-friendly websites and apply design fundamentals, HTML, CSS, and JavaScript skills in practical projects while continuing to learn.",
  portraitImage: "/nikita-portrait.jpg",
  socialLinks: {
    linkedin: "https://www.linkedin.com/in/nikita-itkar-148344384",
    github: "https://github.com/itkarnikita80-cpu",
    instagram: "https://www.instagram.com/nikiiiiiiii_7788"
  }
};

export const skillsData = [
  {
    category: "Web Design & Front-End Development",
    priority: true,
    description: "Core focus on clean design aesthetics, semantic structure, responsive layouts, and modern front-end logic.",
    skills: [
      { name: "HTML5", detail: "Semantic markup, accessibility, document hierarchy" },
      { name: "CSS3", detail: "Responsive layouts, Flexbox, Grid, custom styling" },
      { name: "Responsive Layout Fundamentals", detail: "Mobile-first design, fluid units, breakpoints" },
      { name: "Basic UI Styling", detail: "Visual hierarchy, typography, spacing, component styling" },
      { name: "JavaScript Fundamentals", detail: "ES6+ syntax, DOM manipulation, interactive web logic" }
    ]
  },
  {
    category: "Programming Languages",
    priority: false,
    description: "Object-oriented and procedural programming foundations learned through rigorous coursework.",
    skills: [
      { name: "Java", detail: "Core concepts, OOP, inheritance, polymorphism, encapsulation" },
      { name: "C", detail: "Procedural programming, memory concepts, algorithms" },
      { name: "C++", detail: "Standard library, object-oriented principles, logic building" }
    ]
  },
  {
    category: "Database & Data Management",
    priority: false,
    description: "Relational database concepts, query design, and data storage workflows.",
    skills: [
      { name: "MySQL", detail: "Relational schema design, tables, joins, data integrity" },
      { name: "SQL Fundamentals", detail: "CRUD operations, query structuring, database normalization" },
      { name: "JDBC / File Handling", detail: "Programmatic data storage and retrieval in Java" }
    ]
  },
  {
    category: "Tools & Developer Environments",
    priority: false,
    description: "Development tools, version control, and Integrated Development Environments (IDEs).",
    skills: [
      { name: "Git", detail: "Version control, branching, committing, workflow tracking" },
      { name: "GitHub", detail: "Remote code repositories, versioning, collaboration" },
      { name: "Visual Studio Code", detail: "Primary frontend development workspace & extensions" },
      { name: "Eclipse IDE", detail: "Java application development and debugging" },
      { name: "IntelliJ IDEA", detail: "Advanced Java software engineering environment" }
    ]
  },
  {
    category: "Computer Science Fundamentals",
    priority: false,
    description: "Theoretical engineering principles underpinning robust software development.",
    skills: [
      { name: "Object-Oriented Programming (OOP)", detail: "Abstraction, encapsulation, inheritance, polymorphism" },
      { name: "Basic Data Structures", detail: "Linked lists, stacks, queues, binary trees" },
      { name: "DBMS Fundamentals", detail: "Database management, transactions, relational models" },
      { name: "Complexity Analysis", detail: "Understanding time and space complexity fundamentals" }
    ]
  }
];

export const academicProjects = [
  {
    id: "java-console-desktop-app",
    title: "Java-Based Console / Desktop Application",
    type: "Academic Project",
    badge: "Core Java & OOP",
    overview: "Developed a functional academic application utilizing Java and object-oriented programming concepts, implementing robust data management and storage workflows.",
    keyPoints: [
      "Designed structured application architecture adhering to core OOP principles: Encapsulation, Inheritance, Abstraction, and Polymorphism.",
      "Practiced and implemented data storage and retrieval mechanisms using file handling and JDBC with MySQL as applicable to the project.",
      "Engineered reliable console/desktop user interaction flows with thorough input validation and structured exception handling.",
      "Organized codebase into clean, modular classes to facilitate maintenance and testing."
    ],
    techStack: ["Java", "OOP", "JDBC", "MySQL", "File Handling"],
    githubUrl: "https://github.com/itkarnikita80-cpu"
  },
  {
    id: "data-structures-implementation",
    title: "Mini Project – Data Structures Implementation",
    type: "Mini Academic Project",
    badge: "Algorithms & Structures",
    overview: "Engineered fundamental data structures from scratch in Java, analyzing operation mechanics, pointer manipulation, and asymptotic runtime complexities.",
    keyPoints: [
      "Implemented custom implementations of Linked Lists, Stacks, Queues, and Binary Tree concepts from first principles in Java.",
      "Reviewed and analyzed time complexity (O(1), O(n), O(log n)) and space complexity across essential insertion, deletion, and traversal operations.",
      "Applied structured testing to verify edge cases such as empty collections, boundary traversals, and dynamic node connections.",
      "Deepened foundational problem-solving abilities applicable to high-performance software engineering."
    ],
    techStack: ["Java", "Data Structures", "Algorithms", "Binary Trees", "Time & Space Complexity"],
    githubUrl: "https://github.com/itkarnikita80-cpu"
  }
];

export const educationData = [
  {
    id: "btech-cse",
    degree: "B.E. / B.Tech in Computer Science & Engineering",
    duration: "2023 – 2027 (Expected)",
    status: "Currently Pursuing (Expected 2027)",
    description: "Comprehensive undergraduate engineering program covering computer science fundamentals, web technologies, software design, object-oriented programming, and database systems.",
    highlights: [
      "Specializing in Web Designing, Front-End Development, and Modern UI Foundations",
      "Hands-on coursework in Data Structures, Algorithms, DBMS, and Object-Oriented Software Design",
      "Active participant in technical symposiums, hackathons, and departmental coding initiatives"
    ]
  },
  {
    id: "hsc-12th",
    degree: "Higher Secondary Education (12th, Science)",
    duration: "Completed",
    status: "Completed",
    description: "Completed higher secondary curriculum with a rigorous concentration in Science, establishing foundational analytical reasoning, mathematics, and logical problem-solving skills.",
    highlights: [
      "Rigorous study in Physics, Chemistry, and Advanced Mathematics",
      "Built strong analytical and problem-solving aptitude leading to Computer Science & Engineering"
    ]
  }
];

export const certificationsData = [
  {
    id: "java-core-adv",
    title: "Java Programming – Core & Advanced Concepts",
    focus: "Object-oriented programming, class design, multithreading fundamentals, collections framework, and advanced syntax.",
    badge: "Programming"
  },
  {
    id: "dsa-cert",
    title: "Data Structures & Algorithms",
    focus: "Foundational data structures (arrays, linked lists, stacks, queues, trees) and algorithmic problem-solving techniques.",
    badge: "Computer Science"
  },
  {
    id: "dbms-sql-cert",
    title: "Introduction to Database Management Systems (SQL)",
    focus: "Relational database architecture, relational algebra, SQL querying, schema normalization, and transaction concepts.",
    badge: "Databases"
  }
];

export const achievementsData = [
  {
    id: "coding-contests",
    title: "Coding Contests & College-Level Technical Events",
    detail: "Actively participated in competitive coding contests, algorithmic challenges, and college-level technical symposiums.",
    icon: "trophy"
  },
  {
    id: "coding-club",
    title: "Computer Science / Coding Club Member",
    detail: "Active member of the Computer Science & Coding Club at college, collaborating with peers on coding activities, technical events, and skill-building workshops.",
    icon: "users"
  }
];
