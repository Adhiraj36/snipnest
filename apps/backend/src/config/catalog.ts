import type { InterestDomain } from '@repo/shared-types';

export const INTEREST_CATALOG: InterestDomain[] = [
  /* ── JavaScript ─────────────────────────────────────────────── */
  {
    id: 'javascript',
    name: 'JavaScript Development',
    language: 'javascript',
    judge0LanguageId: 63,
    subDomains: [
      {
        id: 'core-js',
        name: 'Core JavaScript',
        topics: [
          { id: 'arrays', name: 'Arrays and Iteration' },
          { id: 'objects', name: 'Objects and Maps' },
          { id: 'async-await', name: 'Async and Await' },
          { id: 'closures', name: 'Closures and Scope' },
        ],
      },
      {
        id: 'problem-solving',
        name: 'Problem Solving',
        topics: [
          { id: 'strings', name: 'String Transformations' },
          { id: 'hashing', name: 'Hashing Basics' },
          { id: 'two-pointers', name: 'Two Pointers' },
        ],
      },
      {
        id: 'dom-and-web',
        name: 'DOM & Web APIs',
        topics: [
          { id: 'dom-manipulation', name: 'DOM Manipulation' },
          { id: 'events', name: 'Event Handling' },
          { id: 'fetch-api', name: 'Fetch & Promises' },
        ],
      },
    ],
  },

  /* ── TypeScript ─────────────────────────────────────────────── */
  {
    id: 'typescript',
    name: 'TypeScript',
    language: 'typescript',
    judge0LanguageId: 74,
    subDomains: [
      {
        id: 'ts-core',
        name: 'Type System',
        topics: [
          { id: 'basic-types', name: 'Basic Types and Interfaces' },
          { id: 'generics', name: 'Generics' },
          { id: 'utility-types', name: 'Utility Types' },
          { id: 'type-narrowing', name: 'Type Narrowing & Guards' },
        ],
      },
      {
        id: 'ts-patterns',
        name: 'Design Patterns',
        topics: [
          { id: 'builder-pattern', name: 'Builder Pattern' },
          { id: 'strategy-pattern', name: 'Strategy Pattern' },
          { id: 'decorator-pattern', name: 'Decorator Pattern' },
        ],
      },
    ],
  },

  /* ── Python ─────────────────────────────────────────────────── */
  {
    id: 'python',
    name: 'Python Programming',
    language: 'python',
    judge0LanguageId: 71,
    subDomains: [
      {
        id: 'python-core',
        name: 'Python Core',
        topics: [
          { id: 'lists', name: 'Lists and Comprehensions' },
          { id: 'dicts', name: 'Dictionaries and Sets' },
          { id: 'functions', name: 'Functions and Scope' },
          { id: 'decorators', name: 'Decorators and Generators' },
        ],
      },
      {
        id: 'algorithms',
        name: 'Algorithms',
        topics: [
          { id: 'sorting', name: 'Sorting Fundamentals' },
          { id: 'searching', name: 'Searching Patterns' },
          { id: 'recursion', name: 'Recursion and Backtracking' },
        ],
      },
      {
        id: 'python-data',
        name: 'Data & Scripting',
        topics: [
          { id: 'file-io', name: 'File I/O and CSV' },
          { id: 'regex', name: 'Regular Expressions' },
          { id: 'json-parsing', name: 'JSON Parsing' },
        ],
      },
    ],
  },

  /* ── C++ ────────────────────────────────────────────────────── */
  {
    id: 'cpp',
    name: 'C++ Programming',
    language: 'cpp',
    judge0LanguageId: 54,
    subDomains: [
      {
        id: 'cpp-core',
        name: 'C++ Core',
        topics: [
          { id: 'stl', name: 'STL Containers' },
          { id: 'pointers', name: 'Pointers and Memory' },
          { id: 'oop', name: 'OOP in C++' },
          { id: 'templates', name: 'Templates Basics' },
        ],
      },
      {
        id: 'dsa',
        name: 'DSA in C++',
        topics: [
          { id: 'arrays-vectors', name: 'Arrays and Vectors' },
          { id: 'graphs', name: 'Graph Traversals' },
          { id: 'dp', name: 'Dynamic Programming Intro' },
        ],
      },
    ],
  },

  /* ── Java ───────────────────────────────────────────────────── */
  {
    id: 'java',
    name: 'Java Programming',
    language: 'java',
    judge0LanguageId: 62,
    subDomains: [
      {
        id: 'java-core',
        name: 'Java Core',
        topics: [
          { id: 'collections', name: 'Collections Framework' },
          { id: 'oop-java', name: 'OOP Principles' },
          { id: 'exceptions', name: 'Exception Handling' },
          { id: 'streams', name: 'Streams and Lambdas' },
        ],
      },
      {
        id: 'java-advanced',
        name: 'Advanced Java',
        topics: [
          { id: 'concurrency', name: 'Concurrency Basics' },
          { id: 'generics-java', name: 'Generics in Depth' },
          { id: 'design-patterns', name: 'Common Design Patterns' },
        ],
      },
    ],
  },

  /* ── C ──────────────────────────────────────────────────────── */
  {
    id: 'c',
    name: 'C Programming',
    language: 'c',
    judge0LanguageId: 50,
    subDomains: [
      {
        id: 'c-core',
        name: 'C Fundamentals',
        topics: [
          { id: 'pointers-c', name: 'Pointers and Arrays' },
          { id: 'structs', name: 'Structs and Unions' },
          { id: 'memory-mgmt', name: 'Dynamic Memory (malloc/free)' },
        ],
      },
      {
        id: 'c-systems',
        name: 'Systems Programming',
        topics: [
          { id: 'file-handling', name: 'File Handling' },
          { id: 'bitwise', name: 'Bitwise Operations' },
          { id: 'linked-lists-c', name: 'Linked Lists from Scratch' },
        ],
      },
    ],
  },

  /* ── Go ─────────────────────────────────────────────────────── */
  {
    id: 'go',
    name: 'Go (Golang)',
    language: 'go',
    judge0LanguageId: 60,
    subDomains: [
      {
        id: 'go-core',
        name: 'Go Fundamentals',
        topics: [
          { id: 'slices-maps', name: 'Slices and Maps' },
          { id: 'goroutines', name: 'Goroutines and Channels' },
          { id: 'interfaces-go', name: 'Interfaces and Embedding' },
          { id: 'error-handling-go', name: 'Error Handling Patterns' },
        ],
      },
      {
        id: 'go-practical',
        name: 'Practical Go',
        topics: [
          { id: 'http-servers', name: 'HTTP Servers' },
          { id: 'json-go', name: 'JSON Encoding/Decoding' },
          { id: 'testing-go', name: 'Testing and Benchmarks' },
        ],
      },
    ],
  },

  /* ── Rust ───────────────────────────────────────────────────── */
  {
    id: 'rust',
    name: 'Rust Programming',
    language: 'rust',
    judge0LanguageId: 73,
    subDomains: [
      {
        id: 'rust-core',
        name: 'Ownership & Types',
        topics: [
          { id: 'ownership', name: 'Ownership and Borrowing' },
          { id: 'enums-matching', name: 'Enums and Pattern Matching' },
          { id: 'traits', name: 'Traits and Generics' },
          { id: 'error-handling-rust', name: 'Result and Option' },
        ],
      },
      {
        id: 'rust-collections',
        name: 'Collections & Iterators',
        topics: [
          { id: 'vectors-rust', name: 'Vectors and HashMaps' },
          { id: 'iterators', name: 'Iterators and Closures' },
          { id: 'strings-rust', name: 'String Types' },
        ],
      },
    ],
  },

  /* ── Ruby ───────────────────────────────────────────────────── */
  {
    id: 'ruby',
    name: 'Ruby Programming',
    language: 'ruby',
    judge0LanguageId: 72,
    subDomains: [
      {
        id: 'ruby-core',
        name: 'Ruby Fundamentals',
        topics: [
          { id: 'blocks-procs', name: 'Blocks, Procs, and Lambdas' },
          { id: 'classes-ruby', name: 'Classes and Modules' },
          { id: 'enumerables', name: 'Enumerables and Iterators' },
        ],
      },
      {
        id: 'ruby-practical',
        name: 'Practical Ruby',
        topics: [
          { id: 'string-processing', name: 'String Processing' },
          { id: 'hashes-ruby', name: 'Hashes and Symbols' },
          { id: 'file-io-ruby', name: 'File I/O' },
        ],
      },
    ],
  },

  /* ── C# ────────────────────────────────────────────────────── */
  {
    id: 'csharp',
    name: 'C# Programming',
    language: 'csharp',
    judge0LanguageId: 51,
    subDomains: [
      {
        id: 'csharp-core',
        name: 'C# Fundamentals',
        topics: [
          { id: 'oop-csharp', name: 'OOP and Inheritance' },
          { id: 'linq', name: 'LINQ Queries' },
          { id: 'async-csharp', name: 'Async/Await Pattern' },
          { id: 'delegates', name: 'Delegates and Events' },
        ],
      },
      {
        id: 'csharp-collections',
        name: 'Data Structures',
        topics: [
          { id: 'lists-csharp', name: 'Lists and Dictionaries' },
          { id: 'generics-csharp', name: 'Generics' },
          { id: 'pattern-matching', name: 'Pattern Matching' },
        ],
      },
    ],
  },

  /* ── Kotlin ────────────────────────────────────────────────── */
  {
    id: 'kotlin',
    name: 'Kotlin',
    language: 'kotlin',
    judge0LanguageId: 78,
    subDomains: [
      {
        id: 'kotlin-core',
        name: 'Kotlin Essentials',
        topics: [
          { id: 'null-safety', name: 'Null Safety' },
          { id: 'data-classes', name: 'Data Classes and Sealed Classes' },
          { id: 'coroutines', name: 'Coroutines Basics' },
          { id: 'extension-fns', name: 'Extension Functions' },
        ],
      },
      {
        id: 'kotlin-functional',
        name: 'Functional Kotlin',
        topics: [
          { id: 'collections-kotlin', name: 'Collection Operations' },
          { id: 'higher-order', name: 'Higher-Order Functions' },
          { id: 'sequences', name: 'Sequences and Lazy Eval' },
        ],
      },
    ],
  },

  /* ── SQL ────────────────────────────────────────────────────── */
  {
    id: 'sql',
    name: 'SQL & Databases',
    language: 'sql',
    judge0LanguageId: 82,
    subDomains: [
      {
        id: 'sql-core',
        name: 'SQL Fundamentals',
        topics: [
          { id: 'select-queries', name: 'SELECT and Filtering' },
          { id: 'joins', name: 'JOINs (Inner, Left, Right)' },
          { id: 'aggregations', name: 'GROUP BY and Aggregations' },
          { id: 'subqueries', name: 'Subqueries and CTEs' },
        ],
      },
      {
        id: 'sql-advanced',
        name: 'Advanced SQL',
        topics: [
          { id: 'window-fns', name: 'Window Functions' },
          { id: 'indexing', name: 'Indexing Strategies' },
          { id: 'normalization', name: 'Normalization & Design' },
        ],
      },
    ],
  },
];

export function findCatalogPath(interestId: string, subDomainId: string, topicId: string) {
  const interest = INTEREST_CATALOG.find((d) => d.id === interestId);
  const subDomain = interest?.subDomains.find((s) => s.id === subDomainId);
  const topic = subDomain?.topics.find((t) => t.id === topicId);
  if (!interest || !subDomain || !topic) return null;
  return { interest, subDomain, topic };
}
