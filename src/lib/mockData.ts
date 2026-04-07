export interface Problem {
  id: string;
  title: string;
  acceptance: number;
  difficulty: "Easy" | "Medium" | "Hard";
  pattern: string;
  status: "solved" | "attempted" | "unsolved";
}

export const problemsData: Problem[] = [
  {
    id: "1",
    title: "Two Sum",
    acceptance: 52.4,
    difficulty: "Easy",
    pattern: "Hash Map",
    status: "solved",
  },
  {
    id: "2",
    title: "Add Two Numbers",
    acceptance: 43.1,
    difficulty: "Medium",
    pattern: "Linked List",
    status: "attempted",
  },
  {
    id: "3",
    title: "Longest Substring Without Repeating Characters",
    acceptance: 35.7,
    difficulty: "Medium",
    pattern: "Sliding Window",
    status: "unsolved",
  },
  {
    id: "4",
    title: "Median of Two Sorted Arrays",
    acceptance: 28.9,
    difficulty: "Hard",
    pattern: "Binary Search",
    status: "unsolved",
  },
  {
    id: "5",
    title: "Longest Palindromic Substring",
    acceptance: 35.2,
    difficulty: "Medium",
    pattern: "Dynamic Programming",
    status: "solved",
  },
  {
    id: "6",
    title: "Merge Intervals",
    acceptance: 47.6,
    difficulty: "Medium",
    pattern: "Intervals",
    status: "attempted",
  },
  {
    id: "7",
    title: "Trapping Rain Water",
    acceptance: 63.3,
    difficulty: "Hard",
    pattern: "Two Pointers",
    status: "unsolved",
  },
];
