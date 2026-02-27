import type { InterestDomain } from '@repo/shared-types';

export const INTEREST_CATALOG: InterestDomain[] = [
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
    ],
  },
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
    ],
  },
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
];

export function findCatalogPath(interestId: string, subDomainId: string, topicId: string) {
  const interest = INTEREST_CATALOG.find((d) => d.id === interestId);
  const subDomain = interest?.subDomains.find((s) => s.id === subDomainId);
  const topic = subDomain?.topics.find((t) => t.id === topicId);
  if (!interest || !subDomain || !topic) return null;
  return { interest, subDomain, topic };
}
