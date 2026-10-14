import { normalizeProblem } from '../shared/problems.js';

/*
 * Seed library: about 520 questions, 22 topics, 83 companies.
 * Every question links to its public LeetCode page.
 *
 * IMPORTANT: company tags and frequency percentages are ILLUSTRATIVE placeholders, not official
 * statistics. Hand-tagged companies use the letter codes below; the remaining companies are
 * assigned deterministically from topic focus (see `profiles`). Replace all of it with data you
 * trust through POST /api/admin/problems/import.
 */

const CODES = { A: 'Amazon', G: 'Google', M: 'Meta', S: 'Microsoft', P: 'Apple', D: 'Adobe', U: 'Uber', N: 'Netflix', L: 'LinkedIn', B: 'Bloomberg', O: 'Oracle' };
const DEFAULT_TIME = { Easy: 15, Medium: 28, Hard: 45 };

// [slug, title, difficulty, company codes, frequency %, minutes (optional)]
const groups = {
  'Arrays & Hashing': [
    ['two-sum', 'Two Sum', 'Easy', 'AGMSPD', 96, 15],
    ['contains-duplicate', 'Contains Duplicate', 'Easy', 'AS', 74, 10],
    ['valid-anagram', 'Valid Anagram', 'Easy', 'ASD', 70, 10],
    ['group-anagrams', 'Group Anagrams', 'Medium', 'AMUB', 85, 25],
    ['top-k-frequent-elements', 'Top K Frequent Elements', 'Medium', 'AMN', 83, 25],
    ['product-of-array-except-self', 'Product of Array Except Self', 'Medium', 'AMPS', 90, 25],
    ['longest-consecutive-sequence', 'Longest Consecutive Sequence', 'Medium', 'GMU', 72, 25],
    ['subarray-sum-equals-k', 'Subarray Sum Equals K', 'Medium', 'MAG', 82, 30],
    ['valid-sudoku', 'Valid Sudoku', 'Medium', 'AGSM', 78, 30],
    ['majority-element', 'Majority Element', 'Easy', 'AGMB', 76, 12],
    ['rotate-array', 'Rotate Array', 'Medium', 'AMSB', 70, 25],
    ['set-matrix-zeroes', 'Set Matrix Zeroes', 'Medium', 'AMS', 71, 25],
    ['spiral-matrix', 'Spiral Matrix', 'Medium', 'AMSG', 80, 30],
    ['rotate-image', 'Rotate Image', 'Medium', 'AMSG', 79, 25],
    ['first-missing-positive', 'First Missing Positive', 'Hard', 'AGMS', 74, 40],
    ['find-the-duplicate-number', 'Find the Duplicate Number', 'Medium', 'AGMS', 73, 30],
    ['4sum-ii', '4Sum II', 'Medium', 'AGU', 58, 30],
    ['word-pattern', 'Word Pattern', 'Easy', 'SD', 56, 12],
    ['isomorphic-strings', 'Isomorphic Strings', 'Easy', 'AS', 57, 12],
    ['ransom-note', 'Ransom Note', 'Easy', 'AB', 58, 10],
    ['intersection-of-two-arrays-ii', 'Intersection of Two Arrays II', 'Easy', 'AMB', 55, 12],
    ['longest-common-prefix', 'Longest Common Prefix', 'Easy', 'AGS', 66, 12],
    ['roman-to-integer', 'Roman to Integer', 'Easy', 'ASPB', 64, 15],
    ['integer-to-roman', 'Integer to Roman', 'Medium', 'AS', 58],
    ['reverse-words-in-a-string', 'Reverse Words in a String', 'Medium', 'AMSB', 68, 20],
    ['zigzag-conversion', 'Zigzag Conversion', 'Medium', 'AS', 52, 25],
    ['string-to-integer-atoi', 'String to Integer (atoi)', 'Medium', 'AMSBP', 72, 30],
    ['find-the-index-of-the-first-occurrence-in-a-string', 'Find the Index of the First Occurrence in a String', 'Easy', 'AS', 60],
    ['text-justification', 'Text Justification', 'Hard', 'AGO', 55],
    ['h-index', 'H-Index', 'Medium', 'AG', 56, 25],
    ['game-of-life', 'Game of Life', 'Medium', 'AGD', 57, 30],
    ['range-sum-query-immutable', 'Range Sum Query - Immutable', 'Easy', 'AM', 50, 12],
    ['continuous-subarray-sum', 'Continuous Subarray Sum', 'Medium', 'MAG', 66],
    ['contiguous-array', 'Contiguous Array', 'Medium', 'MA', 62]
  ],
  'Two Pointers': [
    ['valid-palindrome', 'Valid Palindrome', 'Easy', 'MS', 78, 12],
    ['3sum', '3Sum', 'Medium', 'AMSP', 88, 30],
    ['container-with-most-water', 'Container With Most Water', 'Medium', 'AGM', 84, 25],
    ['trapping-rain-water', 'Trapping Rain Water', 'Hard', 'MAGS', 75, 40],
    ['move-zeroes', 'Move Zeroes', 'Easy', 'MD', 76, 12],
    ['two-sum-ii-input-array-is-sorted', 'Two Sum II - Input Array Is Sorted', 'Medium', 'AMS', 78, 20],
    ['3sum-closest', '3Sum Closest', 'Medium', 'AGS', 64],
    ['sort-colors', 'Sort Colors', 'Medium', 'AMSP', 80, 25],
    ['remove-duplicates-from-sorted-array', 'Remove Duplicates from Sorted Array', 'Easy', 'AMSB', 72],
    ['merge-sorted-array', 'Merge Sorted Array', 'Easy', 'AMSB', 78],
    ['remove-element', 'Remove Element', 'Easy', 'AS', 58, 10],
    ['is-subsequence', 'Is Subsequence', 'Easy', 'GAS', 60, 12],
    ['4sum', '4Sum', 'Medium', 'AGS', 62],
    ['boats-to-save-people', 'Boats to Save People', 'Medium', 'AG', 56],
    ['next-permutation', 'Next Permutation', 'Medium', 'AGMS', 76, 30],
    ['remove-duplicates-from-sorted-array-ii', 'Remove Duplicates from Sorted Array II', 'Medium', 'AM', 58],
    ['reverse-string', 'Reverse String', 'Easy', 'AS', 52, 10]
  ],
  'Sliding Window': [
    ['best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'Easy', 'AMS', 91, 15],
    ['longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'Medium', 'GAMSD', 92, 25],
    ['longest-repeating-character-replacement', 'Longest Repeating Character Replacement', 'Medium', 'GU', 68, 30],
    ['minimum-window-substring', 'Minimum Window Substring', 'Hard', 'MGU', 80, 45],
    ['sliding-window-maximum', 'Sliding Window Maximum', 'Hard', 'AG', 73, 40],
    ['find-all-anagrams-in-a-string', 'Find All Anagrams in a String', 'Medium', 'AMS', 74],
    ['permutation-in-string', 'Permutation in String', 'Medium', 'AG', 70],
    ['maximum-average-subarray-i', 'Maximum Average Subarray I', 'Easy', 'AS', 52, 12],
    ['minimum-size-subarray-sum', 'Minimum Size Subarray Sum', 'Medium', 'AMS', 72],
    ['fruit-into-baskets', 'Fruit Into Baskets', 'Medium', 'AG', 62],
    ['max-consecutive-ones-iii', 'Max Consecutive Ones III', 'Medium', 'MAG', 66],
    ['substring-with-concatenation-of-all-words', 'Substring with Concatenation of All Words', 'Hard', 'AGM', 52]
  ],
  Stack: [
    ['valid-parentheses', 'Valid Parentheses', 'Easy', 'AMSG', 93, 12],
    ['min-stack', 'Min Stack', 'Medium', 'ASG', 79, 25],
    ['daily-temperatures', 'Daily Temperatures', 'Medium', 'AG', 71, 25],
    ['evaluate-reverse-polish-notation', 'Evaluate Reverse Polish Notation', 'Medium', 'AU', 62, 25],
    ['largest-rectangle-in-histogram', 'Largest Rectangle in Histogram', 'Hard', 'AG', 66, 45],
    ['decode-string', 'Decode String', 'Medium', 'AGMB', 82],
    ['simplify-path', 'Simplify Path', 'Medium', 'AMSG', 66, 25],
    ['basic-calculator', 'Basic Calculator', 'Hard', 'AGMB', 72, 40],
    ['basic-calculator-ii', 'Basic Calculator II', 'Medium', 'AMS', 70],
    ['asteroid-collision', 'Asteroid Collision', 'Medium', 'AMU', 66],
    ['next-greater-element-i', 'Next Greater Element I', 'Easy', 'AM', 52],
    ['car-fleet', 'Car Fleet', 'Medium', 'AG', 58],
    ['remove-k-digits', 'Remove K Digits', 'Medium', 'AG', 60],
    ['online-stock-span', 'Online Stock Span', 'Medium', 'AG', 56]
  ],
  'Binary Search': [
    ['binary-search', 'Binary Search', 'Easy', 'SA', 64, 10],
    ['search-in-rotated-sorted-array', 'Search in Rotated Sorted Array', 'Medium', 'AMSG', 89, 30],
    ['find-minimum-in-rotated-sorted-array', 'Find Minimum in Rotated Sorted Array', 'Medium', 'AS', 74, 25],
    ['koko-eating-bananas', 'Koko Eating Bananas', 'Medium', 'AG', 67, 30],
    ['median-of-two-sorted-arrays', 'Median of Two Sorted Arrays', 'Hard', 'GAP', 77, 50],
    ['time-based-key-value-store', 'Time Based Key-Value Store', 'Medium', 'GU', 65, 30],
    ['search-insert-position', 'Search Insert Position', 'Easy', 'AM', 62, 10],
    ['search-a-2d-matrix', 'Search a 2D Matrix', 'Medium', 'AMS', 74, 25],
    ['find-first-and-last-position-of-element-in-sorted-array', 'Find First and Last Position of Element in Sorted Array', 'Medium', 'AMGB', 80],
    ['find-peak-element', 'Find Peak Element', 'Medium', 'AMG', 72],
    ['split-array-largest-sum', 'Split Array Largest Sum', 'Hard', 'AGM', 62],
    ['capacity-to-ship-packages-within-d-days', 'Capacity To Ship Packages Within D Days', 'Medium', 'AG', 66],
    ['search-a-2d-matrix-ii', 'Search a 2D Matrix II', 'Medium', 'AGM', 66],
    ['find-k-closest-elements', 'Find K Closest Elements', 'Medium', 'AMG', 62],
    ['first-bad-version', 'First Bad Version', 'Easy', 'AMG', 58, 10]
  ],
  'Linked List': [
    ['reverse-linked-list', 'Reverse Linked List', 'Easy', 'ASP', 90, 12],
    ['merge-two-sorted-lists', 'Merge Two Sorted Lists', 'Easy', 'ASP', 86],
    ['linked-list-cycle', 'Linked List Cycle', 'Easy', 'AS', 80],
    ['reorder-list', 'Reorder List', 'Medium', 'AS', 70, 30],
    ['remove-nth-node-from-end-of-list', 'Remove Nth Node From End of List', 'Medium', 'MA', 75, 20],
    ['merge-k-sorted-lists', 'Merge k Sorted Lists', 'Hard', 'AGMU', 85, 40],
    ['copy-list-with-random-pointer', 'Copy List with Random Pointer', 'Medium', 'AMS', 78, 30],
    ['add-two-numbers', 'Add Two Numbers', 'Medium', 'AMSGB', 88, 25],
    ['palindrome-linked-list', 'Palindrome Linked List', 'Easy', 'AMS', 76],
    ['intersection-of-two-linked-lists', 'Intersection of Two Linked Lists', 'Easy', 'AMSB', 72],
    ['remove-linked-list-elements', 'Remove Linked List Elements', 'Easy', 'AS', 52],
    ['swap-nodes-in-pairs', 'Swap Nodes in Pairs', 'Medium', 'AMS', 66],
    ['reverse-nodes-in-k-group', 'Reverse Nodes in k-Group', 'Hard', 'AGMS', 70],
    ['rotate-list', 'Rotate List', 'Medium', 'AMS', 60],
    ['odd-even-linked-list', 'Odd Even Linked List', 'Medium', 'AM', 58],
    ['sort-list', 'Sort List', 'Medium', 'AMGS', 66],
    ['linked-list-cycle-ii', 'Linked List Cycle II', 'Medium', 'AMS', 74],
    ['reverse-linked-list-ii', 'Reverse Linked List II', 'Medium', 'AMS', 72],
    ['remove-duplicates-from-sorted-list', 'Remove Duplicates from Sorted List', 'Easy', 'AMS', 56, 12]
  ],
  Trees: [
    ['invert-binary-tree', 'Invert Binary Tree', 'Easy', 'GA', 72, 10],
    ['maximum-depth-of-binary-tree', 'Maximum Depth of Binary Tree', 'Easy', 'AS', 74, 10],
    ['binary-tree-level-order-traversal', 'Binary Tree Level Order Traversal', 'Medium', 'ASM', 84, 25],
    ['lowest-common-ancestor-of-a-binary-tree', 'Lowest Common Ancestor of a Binary Tree', 'Medium', 'MAS', 88, 30],
    ['validate-binary-search-tree', 'Validate Binary Search Tree', 'Medium', 'AMS', 86, 25],
    ['kth-smallest-element-in-a-bst', 'Kth Smallest Element in a BST', 'Medium', 'AG', 73, 25],
    ['binary-tree-right-side-view', 'Binary Tree Right Side View', 'Medium', 'MA', 81, 25],
    ['binary-tree-maximum-path-sum', 'Binary Tree Maximum Path Sum', 'Hard', 'MGA', 79, 45],
    ['serialize-and-deserialize-binary-tree', 'Serialize and Deserialize Binary Tree', 'Hard', 'MAG', 76, 45],
    ['same-tree', 'Same Tree', 'Easy', 'AMS', 62, 10],
    ['subtree-of-another-tree', 'Subtree of Another Tree', 'Easy', 'AMS', 62],
    ['symmetric-tree', 'Symmetric Tree', 'Easy', 'AMS', 72, 12],
    ['diameter-of-binary-tree', 'Diameter of Binary Tree', 'Easy', 'AMGS', 74, 15],
    ['balanced-binary-tree', 'Balanced Binary Tree', 'Easy', 'AMS', 66, 15],
    ['count-good-nodes-in-binary-tree', 'Count Good Nodes in Binary Tree', 'Medium', 'AMS', 62],
    ['construct-binary-tree-from-preorder-and-inorder-traversal', 'Construct Binary Tree from Preorder and Inorder Traversal', 'Medium', 'AMGS', 78, 30],
    ['path-sum', 'Path Sum', 'Easy', 'AMS', 62, 12],
    ['path-sum-ii', 'Path Sum II', 'Medium', 'AMS', 60],
    ['sum-root-to-leaf-numbers', 'Sum Root to Leaf Numbers', 'Medium', 'AMS', 56],
    ['flatten-binary-tree-to-linked-list', 'Flatten Binary Tree to Linked List', 'Medium', 'AMS', 66],
    ['binary-tree-zigzag-level-order-traversal', 'Binary Tree Zigzag Level Order Traversal', 'Medium', 'AMSB', 72],
    ['convert-sorted-array-to-binary-search-tree', 'Convert Sorted Array to Binary Search Tree', 'Easy', 'AMS', 58, 15],
    ['lowest-common-ancestor-of-a-binary-search-tree', 'Lowest Common Ancestor of a Binary Search Tree', 'Medium', 'AMS', 66, 20],
    ['binary-tree-inorder-traversal', 'Binary Tree Inorder Traversal', 'Easy', 'AMS', 60, 12],
    ['minimum-depth-of-binary-tree', 'Minimum Depth of Binary Tree', 'Easy', 'AMS', 52, 12],
    ['populating-next-right-pointers-in-each-node', 'Populating Next Right Pointers in Each Node', 'Medium', 'AMS', 60]
  ],
  Tries: [
    ['implement-trie-prefix-tree', 'Implement Trie (Prefix Tree)', 'Medium', 'GAS', 76, 30],
    ['design-add-and-search-words-data-structure', 'Design Add and Search Words Data Structure', 'Medium', 'GAM', 66, 30],
    ['word-search-ii', 'Word Search II', 'Hard', 'AGMU', 72, 45],
    ['replace-words', 'Replace Words', 'Medium', 'AG', 50, 25]
  ],
  Graphs: [
    ['number-of-islands', 'Number of Islands', 'Medium', 'AGMS', 81, 28],
    ['clone-graph', 'Clone Graph', 'Medium', 'MAG', 72, 30],
    ['course-schedule', 'Course Schedule', 'Medium', 'GAM', 78, 30],
    ['rotting-oranges', 'Rotting Oranges', 'Medium', 'AS', 80, 30],
    ['pacific-atlantic-water-flow', 'Pacific Atlantic Water Flow', 'Medium', 'GA', 64, 35],
    ['network-delay-time', 'Network Delay Time', 'Medium', 'AG', 63, 35],
    ['cheapest-flights-within-k-stops', 'Cheapest Flights Within K Stops', 'Medium', 'AUG', 66, 35],
    ['word-ladder', 'Word Ladder', 'Hard', 'AGM', 77, 45],
    ['surrounded-regions', 'Surrounded Regions', 'Medium', 'AMG', 64],
    ['max-area-of-island', 'Max Area of Island', 'Medium', 'AMGU', 72],
    ['number-of-provinces', 'Number of Provinces', 'Medium', 'AMG', 66],
    ['redundant-connection', 'Redundant Connection', 'Medium', 'AG', 60],
    ['accounts-merge', 'Accounts Merge', 'Medium', 'AMG', 68, 35],
    ['evaluate-division', 'Evaluate Division', 'Medium', 'AGU', 64, 35],
    ['minimum-height-trees', 'Minimum Height Trees', 'Medium', 'AG', 58, 35],
    ['01-matrix', '01 Matrix', 'Medium', 'AMG', 66],
    ['shortest-path-in-binary-matrix', 'Shortest Path in Binary Matrix', 'Medium', 'AMG', 60],
    ['min-cost-to-connect-all-points', 'Min Cost to Connect All Points', 'Medium', 'AG', 60, 35],
    ['open-the-lock', 'Open the Lock', 'Medium', 'AG', 54],
    ['is-graph-bipartite', 'Is Graph Bipartite?', 'Medium', 'AG', 58],
    ['keys-and-rooms', 'Keys and Rooms', 'Medium', 'AG', 50, 20],
    ['reconstruct-itinerary', 'Reconstruct Itinerary', 'Hard', 'GU', 62, 45],
    ['swim-in-rising-water', 'Swim in Rising Water', 'Hard', 'GA', 52, 45],
    ['course-schedule-ii', 'Course Schedule II', 'Medium', 'AGM', 76],
    ['find-the-town-judge', 'Find the Town Judge', 'Easy', 'AM', 50, 15]
  ],
  Heap: [
    ['kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'Medium', 'AMP', 87, 25],
    ['k-closest-points-to-origin', 'K Closest Points to Origin', 'Medium', 'AM', 82, 25],
    ['task-scheduler', 'Task Scheduler', 'Medium', 'MA', 72],
    ['find-median-from-data-stream', 'Find Median from Data Stream', 'Hard', 'AGU', 76, 45],
    ['last-stone-weight', 'Last Stone Weight', 'Easy', 'AM', 56, 15],
    ['kth-largest-element-in-a-stream', 'Kth Largest Element in a Stream', 'Easy', 'AMG', 58, 15],
    ['reorganize-string', 'Reorganize String', 'Medium', 'AMG', 68],
    ['top-k-frequent-words', 'Top K Frequent Words', 'Medium', 'AMB', 70],
    ['find-k-pairs-with-smallest-sums', 'Find K Pairs with Smallest Sums', 'Medium', 'AG', 52],
    ['ipo', 'IPO', 'Hard', 'AG', 50],
    ['sort-characters-by-frequency', 'Sort Characters By Frequency', 'Medium', 'AMB', 62, 20]
  ],
  Intervals: [
    ['merge-intervals', 'Merge Intervals', 'Medium', 'MGAS', 89, 30],
    ['insert-interval', 'Insert Interval', 'Medium', 'GM', 72],
    ['non-overlapping-intervals', 'Non-overlapping Intervals', 'Medium', 'AM', 65, 25],
    ['summary-ranges', 'Summary Ranges', 'Easy', 'AMG', 52, 12],
    ['minimum-number-of-arrows-to-burst-balloons', 'Minimum Number of Arrows to Burst Balloons', 'Medium', 'AMG', 56],
    ['interval-list-intersections', 'Interval List Intersections', 'Medium', 'MAG', 58],
    ['car-pooling', 'Car Pooling', 'Medium', 'AGU', 54],
    ['my-calendar-i', 'My Calendar I', 'Medium', 'GAM', 50]
  ],
  Greedy: [
    ['jump-game', 'Jump Game', 'Medium', 'AGMS', 84, 25],
    ['jump-game-ii', 'Jump Game II', 'Medium', 'AGMS', 76],
    ['gas-station', 'Gas Station', 'Medium', 'AGMS', 70],
    ['candy', 'Candy', 'Hard', 'AGM', 62, 40],
    ['partition-labels', 'Partition Labels', 'Medium', 'AMG', 70],
    ['hand-of-straights', 'Hand of Straights', 'Medium', 'AG', 54],
    ['merge-triplets-to-form-target-triplet', 'Merge Triplets to Form Target Triplet', 'Medium', 'AG', 40, 25],
    ['valid-parenthesis-string', 'Valid Parenthesis String', 'Medium', 'AGM', 58],
    ['assign-cookies', 'Assign Cookies', 'Easy', 'AS', 50, 12],
    ['lemonade-change', 'Lemonade Change', 'Easy', 'AM', 48, 12]
  ],
  Backtracking: [
    ['subsets', 'Subsets', 'Medium', 'AM', 75, 25],
    ['permutations', 'Permutations', 'Medium', 'SA', 78, 25],
    ['combination-sum', 'Combination Sum', 'Medium', 'AG', 76],
    ['generate-parentheses', 'Generate Parentheses', 'Medium', 'GAM', 80, 25],
    ['word-search', 'Word Search', 'Medium', 'ASM', 77],
    ['n-queens', 'N-Queens', 'Hard', 'GA', 62, 50],
    ['subsets-ii', 'Subsets II', 'Medium', 'AM', 62, 25],
    ['combination-sum-ii', 'Combination Sum II', 'Medium', 'AM', 62],
    ['permutations-ii', 'Permutations II', 'Medium', 'AMS', 58, 25],
    ['palindrome-partitioning', 'Palindrome Partitioning', 'Medium', 'AGM', 66],
    ['letter-combinations-of-a-phone-number', 'Letter Combinations of a Phone Number', 'Medium', 'AMGS', 82, 25],
    ['n-queens-ii', 'N-Queens II', 'Hard', 'AG', 50, 40],
    ['restore-ip-addresses', 'Restore IP Addresses', 'Medium', 'AGM', 60],
    ['combinations', 'Combinations', 'Medium', 'AM', 54, 25],
    ['partition-to-k-equal-sum-subsets', 'Partition to K Equal Sum Subsets', 'Medium', 'AG', 52, 35],
    ['matchsticks-to-square', 'Matchsticks to Square', 'Medium', 'AG', 46, 35]
  ],
  'Dynamic Programming': [
    ['climbing-stairs', 'Climbing Stairs', 'Easy', 'AGD', 82, 15],
    ['house-robber', 'House Robber', 'Medium', 'AG', 80, 25],
    ['coin-change', 'Coin Change', 'Medium', 'AGS', 89],
    ['longest-increasing-subsequence', 'Longest Increasing Subsequence', 'Medium', 'GAS', 81],
    ['longest-common-subsequence', 'Longest Common Subsequence', 'Medium', 'GA', 72],
    ['word-break', 'Word Break', 'Medium', 'AGM', 86],
    ['unique-paths', 'Unique Paths', 'Medium', 'AG', 70, 25],
    ['decode-ways', 'Decode Ways', 'Medium', 'MGA', 74],
    ['partition-equal-subset-sum', 'Partition Equal Subset Sum', 'Medium', 'AM', 68, 35],
    ['edit-distance', 'Edit Distance', 'Medium', 'GAS', 71, 40],
    ['min-cost-climbing-stairs', 'Min Cost Climbing Stairs', 'Easy', 'AG', 62, 15],
    ['house-robber-ii', 'House Robber II', 'Medium', 'AG', 66, 25],
    ['longest-palindromic-substring', 'Longest Palindromic Substring', 'Medium', 'AGMS', 87],
    ['palindromic-substrings', 'Palindromic Substrings', 'Medium', 'AMG', 68],
    ['maximum-product-subarray', 'Maximum Product Subarray', 'Medium', 'AMGS', 76],
    ['maximum-subarray', 'Maximum Subarray', 'Medium', 'AMGSP', 90, 20],
    ['triangle', 'Triangle', 'Medium', 'AGS', 56],
    ['minimum-path-sum', 'Minimum Path Sum', 'Medium', 'AGS', 62],
    ['unique-paths-ii', 'Unique Paths II', 'Medium', 'AGS', 58],
    ['coin-change-ii', 'Coin Change II', 'Medium', 'AG', 66],
    ['target-sum', 'Target Sum', 'Medium', 'AMG', 66],
    ['interleaving-string', 'Interleaving String', 'Medium', 'AG', 52, 40],
    ['distinct-subsequences', 'Distinct Subsequences', 'Hard', 'AG', 58],
    ['best-time-to-buy-and-sell-stock-with-cooldown', 'Best Time to Buy and Sell Stock with Cooldown', 'Medium', 'AGM', 66],
    ['burst-balloons', 'Burst Balloons', 'Hard', 'AG', 58],
    ['regular-expression-matching', 'Regular Expression Matching', 'Hard', 'AGMU', 66, 50],
    ['wildcard-matching', 'Wildcard Matching', 'Hard', 'AGM', 56, 45],
    ['ones-and-zeroes', 'Ones and Zeroes', 'Medium', 'AG', 50],
    ['perfect-squares', 'Perfect Squares', 'Medium', 'AGM', 66],
    ['maximal-square', 'Maximal Square', 'Medium', 'AGM', 64],
    ['longest-valid-parentheses', 'Longest Valid Parentheses', 'Hard', 'AGM', 64],
    ['best-time-to-buy-and-sell-stock-ii', 'Best Time to Buy and Sell Stock II', 'Medium', 'AMSB', 78, 20],
    ['best-time-to-buy-and-sell-stock-iii', 'Best Time to Buy and Sell Stock III', 'Hard', 'AG', 52, 45]
  ],
  'Math & Bit Manipulation': [
    ['number-of-1-bits', 'Number of 1 Bits', 'Easy', 'AMS', 62, 10],
    ['counting-bits', 'Counting Bits', 'Easy', 'AMG', 62, 12],
    ['reverse-bits', 'Reverse Bits', 'Easy', 'AMS', 58, 12],
    ['sum-of-two-integers', 'Sum of Two Integers', 'Medium', 'AMS', 56, 20],
    ['powx-n', 'Pow(x, n)', 'Medium', 'AMGS', 72, 25],
    ['sqrtx', 'Sqrt(x)', 'Easy', 'AMGS', 66, 12],
    ['palindrome-number', 'Palindrome Number', 'Easy', 'AMSB', 68, 10],
    ['reverse-integer', 'Reverse Integer', 'Medium', 'AMSB', 70, 20],
    ['fizz-buzz', 'Fizz Buzz', 'Easy', 'AMS', 60, 8],
    ['count-primes', 'Count Primes', 'Medium', 'AMS', 60, 25],
    ['multiply-strings', 'Multiply Strings', 'Medium', 'AMGS', 70, 30],
    ['add-binary', 'Add Binary', 'Easy', 'AMS', 62, 12],
    ['factorial-trailing-zeroes', 'Factorial Trailing Zeroes', 'Medium', 'AMS', 52, 20],
    ['excel-sheet-column-number', 'Excel Sheet Column Number', 'Easy', 'AMS', 50, 10],
    ['add-strings', 'Add Strings', 'Easy', 'AMS', 56, 12],
    ['happy-number', 'Happy Number', 'Easy', 'AMS', 56, 12],
    ['plus-one', 'Plus One', 'Easy', 'AMS', 64, 10],
    ['single-number', 'Single Number', 'Easy', 'AMS', 72, 10],
    ['missing-number', 'Missing Number', 'Easy', 'AMS', 66, 10]
  ],
  Design: [
    ['lru-cache', 'LRU Cache', 'Medium', 'SAMGUN', 84, 35],
    ['insert-delete-getrandom-o1', 'Insert Delete GetRandom O(1)', 'Medium', 'MA', 77],
    ['design-twitter', 'Design Twitter', 'Medium', 'AM', 64, 40],
    ['lfu-cache', 'LFU Cache', 'Hard', 'AGN', 66, 50],
    ['implement-queue-using-stacks', 'Implement Queue using Stacks', 'Easy', 'AMS', 62, 15],
    ['implement-stack-using-queues', 'Implement Stack using Queues', 'Easy', 'AMS', 56, 15],
    ['design-hashmap', 'Design HashMap', 'Easy', 'AMS', 56, 20],
    ['design-browser-history', 'Design Browser History', 'Medium', 'AMG', 60, 25],
    ['snapshot-array', 'Snapshot Array', 'Medium', 'AG', 52, 30],
    ['design-underground-system', 'Design Underground System', 'Medium', 'AG', 52, 30],
    ['design-circular-queue', 'Design Circular Queue', 'Medium', 'AMS', 52, 25],
    ['all-oone-data-structure', 'All O`one Data Structure', 'Hard', 'AG', 46, 50]
  ]
};

/* ---- Expansion set ---- */

// Default hand-tag letters per topic. For the questions below, a deterministic subset of these is used.
const TOPIC_CODES = {
  'Arrays & Hashing': 'AMGS', Strings: 'AMSB', 'Two Pointers': 'AMS', 'Sliding Window': 'AGM', Stack: 'AGM', 'Binary Search': 'AGM',
  'Linked List': 'AMS', Sorting: 'AMS', Trees: 'AMS', Tries: 'AGM', Heap: 'AMG', Intervals: 'AMG', Greedy: 'AGM', 'Divide & Conquer': 'AGM',
  Matrix: 'AGMS', Backtracking: 'AGM', Graphs: 'AGM', 'Union Find': 'AGM', 'Advanced Graphs': 'AGU', 'Dynamic Programming': 'AGM',
  'Math & Bit Manipulation': 'AMS', Design: 'AMG'
};

// [slug, title, difficulty]
const extraGroups = {
  'Arrays & Hashing': [
    ['pascals-triangle', "Pascal's Triangle", 'Easy'], ['pascals-triangle-ii', "Pascal's Triangle II", 'Easy'],
    ['subarray-sums-divisible-by-k', 'Subarray Sums Divisible by K', 'Medium'], ['shuffle-an-array', 'Shuffle an Array', 'Medium'],
    ['find-all-duplicates-in-an-array', 'Find All Duplicates in an Array', 'Medium'], ['find-pivot-index', 'Find Pivot Index', 'Easy'],
    ['running-sum-of-1d-array', 'Running Sum of 1d Array', 'Easy'], ['k-diff-pairs-in-an-array', 'K-diff Pairs in an Array', 'Medium'],
    ['brick-wall', 'Brick Wall', 'Medium'], ['minimum-index-sum-of-two-lists', 'Minimum Index Sum of Two Lists', 'Easy'],
    ['count-number-of-nice-subarrays', 'Count Number of Nice Subarrays', 'Medium'], ['number-of-good-pairs', 'Number of Good Pairs', 'Easy'],
    ['check-if-array-pairs-are-divisible-by-k', 'Check If Array Pairs Are Divisible by k', 'Medium'], ['make-sum-divisible-by-p', 'Make Sum Divisible by P', 'Medium']
  ],
  Strings: [
    ['valid-palindrome-ii', 'Valid Palindrome II', 'Easy'], ['count-and-say', 'Count and Say', 'Medium'], ['compare-version-numbers', 'Compare Version Numbers', 'Medium'],
    ['string-compression', 'String Compression', 'Medium'], ['backspace-string-compare', 'Backspace String Compare', 'Easy'],
    ['minimum-add-to-make-parentheses-valid', 'Minimum Add to Make Parentheses Valid', 'Medium'], ['minimum-remove-to-make-valid-parentheses', 'Minimum Remove to Make Valid Parentheses', 'Medium'],
    ['valid-number', 'Valid Number', 'Hard'], ['license-key-formatting', 'License Key Formatting', 'Easy'], ['reverse-vowels-of-a-string', 'Reverse Vowels of a String', 'Easy'],
    ['shortest-palindrome', 'Shortest Palindrome', 'Hard'], ['repeated-substring-pattern', 'Repeated Substring Pattern', 'Easy'], ['longest-palindrome', 'Longest Palindrome', 'Easy'],
    ['first-unique-character-in-a-string', 'First Unique Character in a String', 'Easy'], ['find-the-difference', 'Find the Difference', 'Easy'], ['custom-sort-string', 'Custom Sort String', 'Medium']
  ],
  'Two Pointers': [
    ['longest-mountain-in-array', 'Longest Mountain in Array', 'Medium'], ['merge-strings-alternately', 'Merge Strings Alternately', 'Easy'],
    ['shortest-unsorted-continuous-subarray', 'Shortest Unsorted Continuous Subarray', 'Medium'], ['rearrange-array-elements-by-sign', 'Rearrange Array Elements by Sign', 'Medium'],
    ['number-of-subsequences-that-satisfy-the-given-sum-condition', 'Number of Subsequences That Satisfy the Given Sum Condition', 'Medium'], ['intersection-of-two-arrays', 'Intersection of Two Arrays', 'Easy']
  ],
  'Sliding Window': [
    ['get-equal-substrings-within-budget', 'Get Equal Substrings Within Budget', 'Medium'], ['maximum-points-you-can-obtain-from-cards', 'Maximum Points You Can Obtain from Cards', 'Medium'],
    ['longest-subarray-of-1s-after-deleting-one-element', "Longest Subarray of 1's After Deleting One Element", 'Medium'], ['grumpy-bookstore-owner', 'Grumpy Bookstore Owner', 'Medium'],
    ['frequency-of-the-most-frequent-element', 'Frequency of the Most Frequent Element', 'Medium'], ['maximum-erasure-value', 'Maximum Erasure Value', 'Medium'],
    ['subarray-product-less-than-k', 'Subarray Product Less Than K', 'Medium'], ['sliding-window-median', 'Sliding Window Median', 'Hard'], ['binary-subarrays-with-sum', 'Binary Subarrays With Sum', 'Medium']
  ],
  Stack: [
    ['next-greater-element-ii', 'Next Greater Element II', 'Medium'], ['sum-of-subarray-minimums', 'Sum of Subarray Minimums', 'Medium'], ['maximum-frequency-stack', 'Maximum Frequency Stack', 'Hard'],
    ['remove-duplicate-letters', 'Remove Duplicate Letters', 'Medium'], ['score-of-parentheses', 'Score of Parentheses', 'Medium'], ['validate-stack-sequences', 'Validate Stack Sequences', 'Medium'], ['baseball-game', 'Baseball Game', 'Easy']
  ],
  'Binary Search': [
    ['guess-number-higher-or-lower', 'Guess Number Higher or Lower', 'Easy'], ['peak-index-in-a-mountain-array', 'Peak Index in a Mountain Array', 'Medium'], ['find-in-mountain-array', 'Find in Mountain Array', 'Hard'],
    ['search-in-rotated-sorted-array-ii', 'Search in Rotated Sorted Array II', 'Medium'], ['single-element-in-a-sorted-array', 'Single Element in a Sorted Array', 'Medium'],
    ['minimum-number-of-days-to-make-m-bouquets', 'Minimum Number of Days to Make m Bouquets', 'Medium'], ['magnetic-force-between-two-balls', 'Magnetic Force Between Two Balls', 'Medium'],
    ['find-the-smallest-divisor-given-a-threshold', 'Find the Smallest Divisor Given a Threshold', 'Medium'], ['kth-missing-positive-number', 'Kth Missing Positive Number', 'Easy'],
    ['arranging-coins', 'Arranging Coins', 'Easy'], ['h-index-ii', 'H-Index II', 'Medium']
  ],
  'Linked List': [
    ['partition-list', 'Partition List', 'Medium'], ['remove-duplicates-from-sorted-list-ii', 'Remove Duplicates from Sorted List II', 'Medium'], ['middle-of-the-linked-list', 'Middle of the Linked List', 'Easy'],
    ['delete-node-in-a-linked-list', 'Delete Node in a Linked List', 'Medium'], ['split-linked-list-in-parts', 'Split Linked List in Parts', 'Medium'],
    ['flatten-a-multilevel-doubly-linked-list', 'Flatten a Multilevel Doubly Linked List', 'Medium'], ['add-two-numbers-ii', 'Add Two Numbers II', 'Medium'],
    ['maximum-twin-sum-of-a-linked-list', 'Maximum Twin Sum of a Linked List', 'Medium'], ['swapping-nodes-in-a-linked-list', 'Swapping Nodes in a Linked List', 'Medium'],
    ['delete-the-middle-node-of-a-linked-list', 'Delete the Middle Node of a Linked List', 'Medium']
  ],
  Sorting: [
    ['largest-number', 'Largest Number', 'Medium'], ['relative-sort-array', 'Relative Sort Array', 'Easy'], ['sort-array-by-parity', 'Sort Array By Parity', 'Easy'],
    ['squares-of-a-sorted-array', 'Squares of a Sorted Array', 'Easy'], ['height-checker', 'Height Checker', 'Easy'], ['maximum-gap', 'Maximum Gap', 'Medium'],
    ['wiggle-sort-ii', 'Wiggle Sort II', 'Medium'], ['minimum-absolute-difference', 'Minimum Absolute Difference', 'Easy'],
    ['sort-integers-by-the-number-of-1-bits', 'Sort Integers by The Number of 1 Bits', 'Easy'], ['valid-triangle-number', 'Valid Triangle Number', 'Medium'],
    ['array-partition', 'Array Partition', 'Easy'], ['sort-an-array', 'Sort an Array', 'Medium'], ['sort-the-people', 'Sort the People', 'Easy']
  ],
  Trees: [
    ['two-sum-iv-input-is-a-bst', 'Two Sum IV - Input is a BST', 'Easy'], ['binary-search-tree-iterator', 'Binary Search Tree Iterator', 'Medium'], ['recover-binary-search-tree', 'Recover Binary Search Tree', 'Medium'],
    ['delete-node-in-a-bst', 'Delete Node in a BST', 'Medium'], ['insert-into-a-binary-search-tree', 'Insert into a Binary Search Tree', 'Medium'], ['unique-binary-search-trees', 'Unique Binary Search Trees', 'Medium'],
    ['binary-tree-preorder-traversal', 'Binary Tree Preorder Traversal', 'Easy'], ['binary-tree-postorder-traversal', 'Binary Tree Postorder Traversal', 'Easy'],
    ['vertical-order-traversal-of-a-binary-tree', 'Vertical Order Traversal of a Binary Tree', 'Hard'], ['binary-tree-cameras', 'Binary Tree Cameras', 'Hard'], ['house-robber-iii', 'House Robber III', 'Medium'],
    ['find-duplicate-subtrees', 'Find Duplicate Subtrees', 'Medium'], ['maximum-width-of-binary-tree', 'Maximum Width of Binary Tree', 'Medium'],
    ['all-nodes-distance-k-in-binary-tree', 'All Nodes Distance K in Binary Tree', 'Medium'], ['binary-tree-paths', 'Binary Tree Paths', 'Easy'], ['path-sum-iii', 'Path Sum III', 'Medium'],
    ['cousins-in-binary-tree', 'Cousins in Binary Tree', 'Easy'], ['merge-two-binary-trees', 'Merge Two Binary Trees', 'Easy'],
    ['construct-binary-tree-from-inorder-and-postorder-traversal', 'Construct Binary Tree from Inorder and Postorder Traversal', 'Medium'],
    ['serialize-and-deserialize-bst', 'Serialize and Deserialize BST', 'Medium'], ['convert-bst-to-greater-tree', 'Convert BST to Greater Tree', 'Medium'], ['range-sum-of-bst', 'Range Sum of BST', 'Easy']
  ],
  Tries: [
    ['maximum-xor-of-two-numbers-in-an-array', 'Maximum XOR of Two Numbers in an Array', 'Medium'], ['longest-word-in-dictionary', 'Longest Word in Dictionary', 'Medium'], ['map-sum-pairs', 'Map Sum Pairs', 'Medium'],
    ['implement-magic-dictionary', 'Implement Magic Dictionary', 'Medium'], ['stream-of-characters', 'Stream of Characters', 'Hard'], ['concatenated-words', 'Concatenated Words', 'Hard'],
    ['palindrome-pairs', 'Palindrome Pairs', 'Hard'], ['short-encoding-of-words', 'Short Encoding of Words', 'Medium'], ['prefix-and-suffix-search', 'Prefix and Suffix Search', 'Hard'],
    ['search-suggestions-system', 'Search Suggestions System', 'Medium']
  ],
  Heap: [
    ['smallest-range-covering-elements-from-k-lists', 'Smallest Range Covering Elements from K Lists', 'Hard'], ['ugly-number-ii', 'Ugly Number II', 'Medium'], ['super-ugly-number', 'Super Ugly Number', 'Medium'],
    ['maximum-performance-of-a-team', 'Maximum Performance of a Team', 'Hard'], ['furthest-building-you-can-reach', 'Furthest Building You Can Reach', 'Medium'], ['seat-reservation-manager', 'Seat Reservation Manager', 'Medium'],
    ['minimum-number-of-refueling-stops', 'Minimum Number of Refueling Stops', 'Hard'], ['single-threaded-cpu', 'Single-Threaded CPU', 'Medium'], ['the-k-weakest-rows-in-a-matrix', 'The K Weakest Rows in a Matrix', 'Easy']
  ],
  Intervals: [
    ['remove-covered-intervals', 'Remove Covered Intervals', 'Medium'], ['my-calendar-ii', 'My Calendar II', 'Medium'], ['data-stream-as-disjoint-intervals', 'Data Stream as Disjoint Intervals', 'Hard'],
    ['video-stitching', 'Video Stitching', 'Medium'], ['maximum-number-of-events-that-can-be-attended', 'Maximum Number of Events That Can Be Attended', 'Medium']
  ],
  Greedy: [
    ['queue-reconstruction-by-height', 'Queue Reconstruction by Height', 'Medium'], ['two-city-scheduling', 'Two City Scheduling', 'Medium'], ['non-decreasing-array', 'Non-decreasing Array', 'Medium'],
    ['wiggle-subsequence', 'Wiggle Subsequence', 'Medium'], ['bag-of-tokens', 'Bag of Tokens', 'Medium'], ['monotone-increasing-digits', 'Monotone Increasing Digits', 'Medium'],
    ['maximum-length-of-pair-chain', 'Maximum Length of Pair Chain', 'Medium'], ['maximum-units-on-a-truck', 'Maximum Units on a Truck', 'Easy']
  ],
  'Divide & Conquer': [
    ['different-ways-to-add-parentheses', 'Different Ways to Add Parentheses', 'Medium'], ['count-of-smaller-numbers-after-self', 'Count of Smaller Numbers After Self', 'Hard'], ['reverse-pairs', 'Reverse Pairs', 'Hard'],
    ['construct-quad-tree', 'Construct Quad Tree', 'Medium'], ['convert-sorted-list-to-binary-search-tree', 'Convert Sorted List to Binary Search Tree', 'Medium'],
    ['the-skyline-problem', 'The Skyline Problem', 'Hard'], ['beautiful-array', 'Beautiful Array', 'Medium'], ['count-of-range-sum', 'Count of Range Sum', 'Hard']
  ],
  Matrix: [
    ['spiral-matrix-ii', 'Spiral Matrix II', 'Medium'], ['diagonal-traverse', 'Diagonal Traverse', 'Medium'], ['transpose-matrix', 'Transpose Matrix', 'Easy'], ['flipping-an-image', 'Flipping an Image', 'Easy'],
    ['toeplitz-matrix', 'Toeplitz Matrix', 'Easy'], ['image-smoother', 'Image Smoother', 'Easy'], ['kth-smallest-element-in-a-sorted-matrix', 'Kth Smallest Element in a Sorted Matrix', 'Medium'],
    ['maximal-rectangle', 'Maximal Rectangle', 'Hard'], ['longest-increasing-path-in-a-matrix', 'Longest Increasing Path in a Matrix', 'Hard'],
    ['count-square-submatrices-with-all-ones', 'Count Square Submatrices with All Ones', 'Medium'], ['island-perimeter', 'Island Perimeter', 'Easy'], ['flood-fill', 'Flood Fill', 'Easy'],
    ['number-of-enclaves', 'Number of Enclaves', 'Medium'], ['as-far-from-land-as-possible', 'As Far from Land as Possible', 'Medium']
  ],
  Backtracking: [
    ['sudoku-solver', 'Sudoku Solver', 'Hard'], ['combination-sum-iii', 'Combination Sum III', 'Medium'], ['beautiful-arrangement', 'Beautiful Arrangement', 'Medium'], ['gray-code', 'Gray Code', 'Medium'],
    ['expression-add-operators', 'Expression Add Operators', 'Hard'], ['remove-invalid-parentheses', 'Remove Invalid Parentheses', 'Hard'], ['letter-case-permutation', 'Letter Case Permutation', 'Medium'],
    ['permutation-sequence', 'Permutation Sequence', 'Hard'], ['word-break-ii', 'Word Break II', 'Hard'],
    ['maximum-length-of-a-concatenated-string-with-unique-characters', 'Maximum Length of a Concatenated String with Unique Characters', 'Medium']
  ],
  Graphs: [
    ['course-schedule-iv', 'Course Schedule IV', 'Medium'], ['possible-bipartition', 'Possible Bipartition', 'Medium'], ['word-ladder-ii', 'Word Ladder II', 'Hard'],
    ['minimum-number-of-vertices-to-reach-all-nodes', 'Minimum Number of Vertices to Reach All Nodes', 'Medium'], ['detonate-the-maximum-bombs', 'Detonate the Maximum Bombs', 'Medium'],
    ['jump-game-iii', 'Jump Game III', 'Medium'], ['nearest-exit-from-entrance-in-maze', 'Nearest Exit from Entrance in Maze', 'Medium'], ['snakes-and-ladders', 'Snakes and Ladders', 'Medium'],
    ['sliding-puzzle', 'Sliding Puzzle', 'Hard'], ['count-sub-islands', 'Count Sub Islands', 'Medium'], ['number-of-closed-islands', 'Number of Closed Islands', 'Medium'],
    ['reorder-routes-to-make-all-paths-lead-to-the-city-zero', 'Reorder Routes to Make All Paths Lead to the City Zero', 'Medium'], ['parallel-courses-iii', 'Parallel Courses III', 'Hard']
  ],
  'Union Find': [
    ['most-stones-removed-with-same-row-or-column', 'Most Stones Removed with Same Row or Column', 'Medium'], ['satisfiability-of-equality-equations', 'Satisfiability of Equality Equations', 'Medium'],
    ['smallest-string-with-swaps', 'Smallest String With Swaps', 'Medium'], ['regions-cut-by-slashes', 'Regions Cut By Slashes', 'Medium'], ['find-if-path-exists-in-graph', 'Find if Path Exists in Graph', 'Easy'],
    ['lexicographically-smallest-equivalent-string', 'Lexicographically Smallest Equivalent String', 'Medium'], ['number-of-operations-to-make-network-connected', 'Number of Operations to Make Network Connected', 'Medium'],
    ['remove-max-number-of-edges-to-keep-graph-fully-traversable', 'Remove Max Number of Edges to Keep Graph Fully Traversable', 'Hard']
  ],
  'Advanced Graphs': [
    ['path-with-minimum-effort', 'Path With Minimum Effort', 'Medium'], ['path-with-maximum-probability', 'Path with Maximum Probability', 'Medium'],
    ['find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance', 'Find the City With the Smallest Number of Neighbors at a Threshold Distance', 'Medium'],
    ['minimum-cost-to-make-at-least-one-valid-path-in-a-grid', 'Minimum Cost to Make at Least One Valid Path in a Grid', 'Hard'], ['shortest-path-visiting-all-nodes', 'Shortest Path Visiting All Nodes', 'Hard'],
    ['critical-connections-in-a-network', 'Critical Connections in a Network', 'Hard'], ['all-paths-from-source-to-target', 'All Paths From Source to Target', 'Medium'],
    ['number-of-ways-to-arrive-at-destination', 'Number of Ways to Arrive at Destination', 'Medium'], ['minimum-genetic-mutation', 'Minimum Genetic Mutation', 'Medium'],
    ['shortest-bridge', 'Shortest Bridge', 'Medium'], ['bus-routes', 'Bus Routes', 'Hard'], ['find-eventual-safe-states', 'Find Eventual Safe States', 'Medium']
  ],
  'Dynamic Programming': [
    ['fibonacci-number', 'Fibonacci Number', 'Easy'], ['n-th-tribonacci-number', 'N-th Tribonacci Number', 'Easy'], ['delete-and-earn', 'Delete and Earn', 'Medium'], ['stone-game', 'Stone Game', 'Medium'],
    ['predict-the-winner', 'Predict the Winner', 'Medium'], ['minimum-falling-path-sum', 'Minimum Falling Path Sum', 'Medium'], ['maximum-length-of-repeated-subarray', 'Maximum Length of Repeated Subarray', 'Medium'],
    ['longest-string-chain', 'Longest String Chain', 'Medium'], ['russian-doll-envelopes', 'Russian Doll Envelopes', 'Hard'], ['arithmetic-slices', 'Arithmetic Slices', 'Medium'],
    ['number-of-longest-increasing-subsequence', 'Number of Longest Increasing Subsequence', 'Medium'], ['minimum-cost-for-tickets', 'Minimum Cost For Tickets', 'Medium'],
    ['domino-and-tromino-tiling', 'Domino and Tromino Tiling', 'Medium'], ['minimum-ascii-delete-sum-for-two-strings', 'Minimum ASCII Delete Sum for Two Strings', 'Medium'],
    ['shortest-common-supersequence', 'Shortest Common Supersequence', 'Hard'], ['min-cost-to-cut-a-stick', 'Minimum Cost to Cut a Stick', 'Hard'], ['integer-break', 'Integer Break', 'Medium'],
    ['largest-divisible-subset', 'Largest Divisible Subset', 'Medium'], ['cherry-pickup', 'Cherry Pickup', 'Hard'], ['guess-number-higher-or-lower-ii', 'Guess Number Higher or Lower II', 'Medium']
  ],
  'Math & Bit Manipulation': [
    ['single-number-ii', 'Single Number II', 'Medium'], ['single-number-iii', 'Single Number III', 'Medium'], ['power-of-two', 'Power of Two', 'Easy'], ['power-of-three', 'Power of Three', 'Easy'],
    ['hamming-distance', 'Hamming Distance', 'Easy'], ['bitwise-and-of-numbers-range', 'Bitwise AND of Numbers Range', 'Medium'], ['divide-two-integers', 'Divide Two Integers', 'Medium'],
    ['ugly-number', 'Ugly Number', 'Easy'], ['number-complement', 'Number Complement', 'Easy'], ['valid-perfect-square', 'Valid Perfect Square', 'Easy'], ['max-points-on-a-line', 'Max Points on a Line', 'Hard']
  ],
  Design: [
    ['design-parking-system', 'Design Parking System', 'Easy'], ['random-pick-with-weight', 'Random Pick with Weight', 'Medium'], ['peeking-iterator', 'Peeking Iterator', 'Medium'],
    ['range-sum-query-mutable', 'Range Sum Query - Mutable', 'Medium'], ['range-sum-query-2d-immutable', 'Range Sum Query 2D - Immutable', 'Medium'], ['number-of-recent-calls', 'Number of Recent Calls', 'Easy'],
    ['product-of-the-last-k-numbers', 'Product of the Last K Numbers', 'Medium'], ['stock-price-fluctuation', 'Stock Price Fluctuation', 'Medium'], ['encode-and-decode-tinyurl', 'Encode and Decode TinyURL', 'Medium'],
    ['design-skiplist', 'Design Skiplist', 'Hard'], ['implement-rand10-using-rand7', 'Implement Rand10() Using Rand7()', 'Medium']
  ]
};

// Existing questions that belong in the more specific topics added with the expansion.
const MOVES = {
  Strings: ['longest-common-prefix', 'roman-to-integer', 'integer-to-roman', 'reverse-words-in-a-string', 'zigzag-conversion', 'string-to-integer-atoi', 'find-the-index-of-the-first-occurrence-in-a-string', 'text-justification', 'word-pattern', 'isomorphic-strings', 'reverse-string'],
  Matrix: ['valid-sudoku', 'set-matrix-zeroes', 'spiral-matrix', 'rotate-image', 'game-of-life'],
  'Union Find': ['number-of-provinces', 'redundant-connection', 'accounts-merge', 'evaluate-division'],
  'Advanced Graphs': ['network-delay-time', 'cheapest-flights-within-k-stops', 'min-cost-to-connect-all-points', 'swim-in-rising-water', 'reconstruct-itinerary'],
  Sorting: ['sort-colors']
};

/* ---- Company profiles ---- */

const ROUNDS = {
  Product: ['Recruiter or online screen', '1 to 2 coding interviews', 'Onsite loop with coding, design, and behavioral rounds'],
  Finance: ['Online assessment (coding and aptitude)', '2 to 3 technical interviews on data structures and problem solving', 'Managerial or HR round'],
  India: ['Online coding round', '2 to 3 data-structure and problem-solving interviews', 'System design or hiring manager round'],
  Services: ['Online aptitude and coding test', 'Technical interview on fundamentals and a coding problem', 'HR round']
};

const coreInfo = [
  { name: 'Amazon', category: 'Big Tech', blurb: 'Strong focus on arrays, graphs, and trees, with behavioral questions built around Leadership Principles.', rounds: ['Online assessment with coding problems', '2 to 3 coding interviews', 'Bar raiser round with behavioral questions'], focus: ['Arrays & Hashing', 'Graphs', 'Trees'] },
  { name: 'Google', category: 'Big Tech', blurb: 'Heavy on algorithmic depth: graphs, dynamic programming, and clean reasoning about complexity.', rounds: ['Recruiter screen', '1 to 2 coding phone screens', 'Onsite loop of mostly algorithm rounds'], focus: ['Graphs', 'Dynamic Programming', 'Binary Search'] },
  { name: 'Meta', category: 'Big Tech', blurb: 'Fast-paced coding rounds where speed and correctness on medium problems both count.', rounds: ['Recruiter call', 'Technical screen with two problems', 'Onsite with coding and behavioral rounds'], focus: ['Trees', 'Arrays & Hashing', 'Graphs'] },
  { name: 'Microsoft', category: 'Big Tech', blurb: 'Balanced rounds covering linked lists, trees, and design-flavored problems, often with a talk-through of trade-offs.', rounds: ['Online assessment', '3 to 4 coding and design discussion rounds', 'Hiring manager conversation'], focus: ['Linked List', 'Trees', 'Design'] },
  { name: 'Apple', category: 'Big Tech', blurb: 'Interviews vary a lot by team, with practical coding and solid fundamentals on arrays, trees, and design.', rounds: ['Recruiter and team match', 'Technical phone screens', 'Onsite with several team interviewers'], focus: ['Arrays & Hashing', 'Trees', 'Design'] },
  { name: 'Netflix', category: 'Big Tech', blurb: 'Small, senior-leaning loops focused on design thinking and practical data-structure choices.', rounds: ['Recruiter conversation', 'Technical conversations with the team', 'Culture-focused rounds'], focus: ['Design', 'Heap', 'Arrays & Hashing'] },
  { name: 'Adobe', category: 'Product', blurb: 'Core data structures and clear code, with plenty of array, string, and dynamic programming questions.', rounds: ['Online coding test', '2 to 3 technical rounds', 'Managerial or HR round'], focus: ['Arrays & Hashing', 'Two Pointers', 'Dynamic Programming'] },
  { name: 'Uber', category: 'Product', blurb: 'Graph and heap problems tied to real systems like routing and scheduling, plus design depth.', rounds: ['Coding screen', 'Onsite with coding rounds and system design', 'Behavioral round'], focus: ['Graphs', 'Heap', 'Design'] }
];

// Remaining companies. `size` is roughly how many questions get tagged; `focus` steers which ones.
const profiles = [
  { name: 'LinkedIn', category: 'Product', size: 34, focus: ['Graphs', 'Trees', 'Design'], blurb: 'Social-graph flavored problems, so expect graphs, trees, and clean API-style design.' },
  { name: 'Bloomberg', category: 'Finance', size: 40, focus: ['Arrays & Hashing', 'Design', 'Stack'], blurb: 'Practical string, array, and data-structure problems with a focus on writing correct, readable code.' },
  { name: 'Oracle', category: 'Product', size: 30, focus: ['Trees', 'Linked List', 'Design'], blurb: 'Enterprise and cloud teams that value solid fundamentals on trees, lists, and hashing.' },
  { name: 'Salesforce', category: 'Product', size: 26, focus: ['Arrays & Hashing', 'Trees', 'Design'], blurb: 'Balanced data-structure questions with some design and object-oriented thinking.' },
  { name: 'Atlassian', category: 'Product', size: 24, focus: ['Design', 'Graphs', 'Arrays & Hashing'], blurb: 'Leans toward practical design and clean code alongside medium algorithm problems.' },
  { name: 'Intuit', category: 'Product', size: 24, focus: ['Dynamic Programming', 'Arrays & Hashing', 'Heap'], blurb: 'Medium-level algorithm rounds, including dynamic programming, plus behavioral depth.' },
  { name: 'Cisco', category: 'Product', size: 22, focus: ['Linked List', 'Trees', 'Stack'], blurb: 'Fundamentals-heavy: lists, trees, stacks, and bit-level reasoning.' },
  { name: 'Nvidia', category: 'Product', size: 20, focus: ['Arrays & Hashing', 'Dynamic Programming', 'Math & Bit Manipulation'], blurb: 'Strong on arrays, dynamic programming, and bit manipulation.' },
  { name: 'Qualcomm', category: 'Product', size: 20, focus: ['Arrays & Hashing', 'Two Pointers', 'Math & Bit Manipulation'], blurb: 'Low-level-minded problems: arrays, pointers, and bit manipulation.' },
  { name: 'Samsung', category: 'Product', size: 20, focus: ['Graphs', 'Backtracking', 'Dynamic Programming'], blurb: 'Simulation, search, and backtracking problems that reward careful implementation.' },
  { name: 'VMware', category: 'Product', size: 20, focus: ['Trees', 'Linked List', 'Stack'], blurb: 'Core data-structure questions with an emphasis on systems-style thinking.' },
  { name: 'SAP', category: 'Product', size: 18, focus: ['Arrays & Hashing', 'Trees', 'Stack'], blurb: 'Fundamentals-focused rounds with array, string, and tree problems.' },
  { name: 'PayPal', category: 'Finance', size: 24, focus: ['Arrays & Hashing', 'Intervals', 'Heap'], blurb: 'Payment-flavored problems around hashing, intervals, and heaps, plus design discussion.' },
  { name: 'Visa', category: 'Finance', size: 20, focus: ['Arrays & Hashing', 'Sliding Window', 'Stack'], blurb: 'Array and string problems with attention to edge cases and clean code.' },
  { name: 'American Express', category: 'Finance', size: 20, focus: ['Arrays & Hashing', 'Dynamic Programming', 'Stack'], blurb: 'Medium coding problems alongside behavioral and system discussions.' },
  { name: 'Airbnb', category: 'Product', size: 22, focus: ['Graphs', 'Backtracking', 'Design'], blurb: 'Practical, implementation-heavy problems with backtracking and graph search.' },
  { name: 'Twitter', category: 'Product', size: 20, focus: ['Design', 'Heap', 'Trees'], blurb: 'Feed- and timeline-style problems, so heaps, trees, and design come up often.' },
  { name: 'Snap', category: 'Product', size: 20, focus: ['Graphs', 'Trees', 'Sliding Window'], blurb: 'Fast algorithm rounds on graphs, trees, and windows.' },
  { name: 'Pinterest', category: 'Product', size: 20, focus: ['Graphs', 'Trees', 'Design'], blurb: 'Graph and tree traversal problems with some design depth.' },
  { name: 'Dropbox', category: 'Product', size: 18, focus: ['Design', 'Trees', 'Graphs'], blurb: 'File-system and sync flavored problems that mix data structures with design.' },
  { name: 'Stripe', category: 'Product', size: 18, focus: ['Arrays & Hashing', 'Design', 'Intervals'], blurb: 'Practical, API-style coding tasks more than classic puzzles.' },
  { name: 'DoorDash', category: 'Product', size: 22, focus: ['Graphs', 'Heap', 'Design'], blurb: 'Logistics-flavored problems: graphs, heaps, and design trade-offs.' },
  { name: 'Lyft', category: 'Product', size: 20, focus: ['Graphs', 'Dynamic Programming', 'Heap'], blurb: 'Routing and matching ideas show up as graph, heap, and dynamic programming questions.' },
  { name: 'Databricks', category: 'Product', size: 20, focus: ['Design', 'Graphs', 'Dynamic Programming'], blurb: 'Strong algorithm rounds with a data-infrastructure flavor.' },
  { name: 'Tesla', category: 'Product', size: 18, focus: ['Arrays & Hashing', 'Dynamic Programming', 'Graphs'], blurb: 'Practical engineering problems with a mix of arrays, graphs, and dynamic programming.' },
  { name: 'TikTok', category: 'Product', size: 28, focus: ['Dynamic Programming', 'Trees', 'Sliding Window'], blurb: 'Algorithm-heavy interviews, frequently medium-to-hard dynamic programming and trees.' },
  { name: 'Walmart', category: 'Product', size: 26, focus: ['Arrays & Hashing', 'Trees', 'Dynamic Programming'], blurb: 'Online assessment plus data-structure rounds, then design for experienced roles.' },
  { name: 'Goldman Sachs', category: 'Finance', size: 30, focus: ['Arrays & Hashing', 'Dynamic Programming', 'Trees'], blurb: 'Online assessment followed by data-structure and problem-solving rounds with careful edge cases.' },
  { name: 'Morgan Stanley', category: 'Finance', size: 24, focus: ['Arrays & Hashing', 'Linked List', 'Stack'], blurb: 'Fundamentals-focused coding rounds, often with questions on lists, stacks, and hashing.' },
  { name: 'JPMorgan Chase', category: 'Finance', size: 24, focus: ['Arrays & Hashing', 'Two Pointers', 'Sliding Window'], blurb: 'Code-assessment style problems on arrays and strings, then technical conversations.' },
  { name: 'Flipkart', category: 'India', size: 30, focus: ['Trees', 'Graphs', 'Dynamic Programming'], blurb: 'Machine-coding and data-structure rounds, with trees, graphs, and dynamic programming common.' },
  { name: 'Swiggy', category: 'India', size: 24, focus: ['Graphs', 'Heap', 'Dynamic Programming'], blurb: 'Delivery-style problems: graphs, heaps, and dynamic programming.' },
  { name: 'Zomato', category: 'India', size: 22, focus: ['Arrays & Hashing', 'Trees', 'Design'], blurb: 'Data-structure rounds followed by design and product-minded discussion.' },
  { name: 'PhonePe', category: 'India', size: 24, focus: ['Trees', 'Design', 'Graphs'], blurb: 'Strong on data structures and low-level design for payments-style systems.' },
  { name: 'Paytm', category: 'India', size: 22, focus: ['Arrays & Hashing', 'Linked List', 'Dynamic Programming'], blurb: 'Core data-structure problems with a focus on clean working code.' },
  { name: 'Razorpay', category: 'India', size: 20, focus: ['Design', 'Arrays & Hashing', 'Binary Search'], blurb: 'Practical coding with design rounds that care about correctness and edge cases.' },
  { name: 'Myntra', category: 'India', size: 20, focus: ['Arrays & Hashing', 'Trees', 'Stack'], blurb: 'Data-structure rounds on arrays, trees, and stacks, plus a design round.' },
  { name: 'CRED', category: 'India', size: 20, focus: ['Dynamic Programming', 'Graphs', 'Heap'], blurb: 'Algorithm-leaning rounds with dynamic programming, graphs, and heaps.' },
  { name: 'Meesho', category: 'India', size: 20, focus: ['Arrays & Hashing', 'Graphs', 'Trees'], blurb: 'Data-structure problems with strong emphasis on clean, efficient solutions.' },
  { name: 'TCS', category: 'Services', size: 24, focus: ['Arrays & Hashing', 'Two Pointers', 'Math & Bit Manipulation'], easyBias: true, blurb: 'Mostly easy-to-medium coding on arrays, strings, and math in the online test.' },
  { name: 'Infosys', category: 'Services', size: 22, focus: ['Arrays & Hashing', 'Linked List', 'Binary Search'], easyBias: true, blurb: 'Easy-to-medium coding on fundamentals, plus aptitude and a technical interview.' },
  { name: 'Intel', category: 'Product', size: 20, focus: ['Arrays & Hashing', 'Math & Bit Manipulation', 'Linked List'], blurb: 'Low-level-minded problems: arrays, bit manipulation, and clean pointer code.' },
  { name: 'AMD', category: 'Product', size: 18, focus: ['Math & Bit Manipulation', 'Arrays & Hashing', 'Strings'], blurb: 'Fundamentals-heavy rounds with bit tricks, arrays, and strings.' },
  { name: 'IBM', category: 'Product', size: 20, focus: ['Arrays & Hashing', 'Strings', 'Sorting'], blurb: 'Fundamentals-focused coding with arrays, strings, and sorting, plus a technical discussion.' },
  { name: 'Dell', category: 'Product', size: 18, focus: ['Arrays & Hashing', 'Linked List', 'Strings'], blurb: 'Core data-structure problems with emphasis on clean, working code.' },
  { name: 'Spotify', category: 'Product', size: 18, focus: ['Design', 'Graphs', 'Arrays & Hashing'], blurb: 'Practical coding with design thinking; expect graph and data-structure problems.' },
  { name: 'Shopify', category: 'Product', size: 18, focus: ['Arrays & Hashing', 'Design', 'Strings'], blurb: 'Pragmatic coding rounds that reward readable, well-structured solutions.' },
  { name: 'Block', category: 'Product', size: 18, focus: ['Design', 'Arrays & Hashing', 'Intervals'], blurb: 'Practical, payments-flavored coding with attention to correctness and API design.' },
  { name: 'Robinhood', category: 'Finance', size: 18, focus: ['Arrays & Hashing', 'Heap', 'Design'], blurb: 'Fintech problems around hashing, heaps, and clean design.' },
  { name: 'Coinbase', category: 'Finance', size: 18, focus: ['Arrays & Hashing', 'Design', 'Graphs'], blurb: 'Practical coding and design problems with a focus on correctness.' },
  { name: 'Instacart', category: 'Product', size: 18, focus: ['Graphs', 'Arrays & Hashing', 'Heap'], blurb: 'Logistics-flavored problems: graphs, heaps, and hashing.' },
  { name: 'Roblox', category: 'Product', size: 18, focus: ['Graphs', 'Dynamic Programming', 'Matrix'], blurb: 'Algorithm rounds with graphs, grids, and dynamic programming.' },
  { name: 'eBay', category: 'Product', size: 20, focus: ['Arrays & Hashing', 'Trees', 'Strings'], blurb: 'Marketplace-style problems with arrays, strings, and trees.' },
  { name: 'Palantir', category: 'Product', size: 20, focus: ['Graphs', 'Design', 'Dynamic Programming'], blurb: 'Demanding problem solving with graphs and design-style discussion.' },
  { name: 'Snowflake', category: 'Product', size: 18, focus: ['Dynamic Programming', 'Graphs', 'Heap'], blurb: 'Algorithm-heavy interviews with a data-infrastructure flavor.' },
  { name: 'Cloudflare', category: 'Product', size: 16, focus: ['Design', 'Strings', 'Arrays & Hashing'], blurb: 'Systems-minded problems around strings, hashing, and design.' },
  { name: 'Zoom', category: 'Product', size: 16, focus: ['Arrays & Hashing', 'Trees', 'Design'], blurb: 'Data-structure rounds followed by design discussion.' },
  { name: 'Citadel', category: 'Finance', size: 22, focus: ['Dynamic Programming', 'Math & Bit Manipulation', 'Heap'], hardBias: true, blurb: 'Very demanding algorithm and math-flavored rounds with strong emphasis on efficiency.' },
  { name: 'Two Sigma', category: 'Finance', size: 20, focus: ['Dynamic Programming', 'Arrays & Hashing', 'Heap'], hardBias: true, blurb: 'Algorithmic rounds that mix data structures with quantitative thinking.' },
  { name: 'DE Shaw', category: 'Finance', size: 20, focus: ['Dynamic Programming', 'Math & Bit Manipulation', 'Graphs'], hardBias: true, blurb: 'Hard algorithm and puzzle-style problems that reward clear reasoning.' },
  { name: 'Jane Street', category: 'Finance', size: 16, focus: ['Math & Bit Manipulation', 'Dynamic Programming', 'Trees'], hardBias: true, blurb: 'Puzzle-heavy, reasoning-first interviews; clean thinking matters more than memorized patterns.' },
  { name: 'Barclays', category: 'Finance', size: 18, focus: ['Arrays & Hashing', 'Strings', 'Sorting'], blurb: 'Online assessment followed by data-structure and problem-solving rounds.' },
  { name: 'Deutsche Bank', category: 'Finance', size: 18, focus: ['Arrays & Hashing', 'Linked List', 'Strings'], blurb: 'Coding assessment plus technical rounds on fundamentals.' },
  { name: 'Wells Fargo', category: 'Finance', size: 16, focus: ['Arrays & Hashing', 'Strings', 'Sorting'], blurb: 'Online coding test and technical interviews on core data structures.' },
  { name: 'Capital One', category: 'Finance', size: 18, focus: ['Arrays & Hashing', 'Strings', 'Matrix'], blurb: 'Coding rounds with a practical bent, plus a case-style or behavioral component.' },
  { name: 'Zoho', category: 'India', size: 24, focus: ['Arrays & Hashing', 'Strings', 'Matrix'], blurb: 'Several elimination rounds of programming problems, often on arrays, strings, and matrices.' },
  { name: 'Groww', category: 'India', size: 18, focus: ['Arrays & Hashing', 'Trees', 'Design'], blurb: 'Data-structure rounds followed by design and machine-coding discussion.' },
  { name: 'Dream11', category: 'India', size: 18, focus: ['Arrays & Hashing', 'Heap', 'Design'], blurb: 'Data-structure problems with a focus on performance and design.' },
  { name: 'Ola', category: 'India', size: 18, focus: ['Graphs', 'Dynamic Programming', 'Heap'], blurb: 'Routing-style problems: graphs, heaps, and dynamic programming.' },
  { name: 'ShareChat', category: 'India', size: 18, focus: ['Arrays & Hashing', 'Trees', 'Dynamic Programming'], blurb: 'Algorithm rounds followed by design and machine-coding.' },
  { name: 'Freshworks', category: 'India', size: 18, focus: ['Arrays & Hashing', 'Strings', 'Trees'], blurb: 'Data-structure rounds, then a design or machine-coding round.' },
  { name: 'Wipro', category: 'Services', size: 18, focus: ['Arrays & Hashing', 'Strings', 'Math & Bit Manipulation'], easyBias: true, blurb: 'Online aptitude and easy-to-medium coding, then a technical and HR round.' },
  { name: 'Cognizant', category: 'Services', size: 18, focus: ['Arrays & Hashing', 'Strings', 'Sorting'], easyBias: true, blurb: 'Aptitude and coding assessment, followed by technical and HR interviews.' },
  { name: 'Accenture', category: 'Services', size: 16, focus: ['Arrays & Hashing', 'Strings', 'Math & Bit Manipulation'], easyBias: true, blurb: 'Cognitive and coding assessment, then technical and HR interviews.' },
  { name: 'Capgemini', category: 'Services', size: 16, focus: ['Arrays & Hashing', 'Strings', 'Sorting'], easyBias: true, blurb: 'Online assessment with coding questions, then technical and HR interviews.' }
];

/* ---- Build ---- */

const fnv = text => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

const raw = [];
for (const [topic, rows] of Object.entries(groups)) {
  for (const [id, title, difficulty, codes, frequency, time] of rows) {
    raw.push({ id, title, topic, difficulty, frequency, time: time ?? DEFAULT_TIME[difficulty], companies: [...codes].map(c => CODES[c]), url: `https://leetcode.com/problems/${id}/` });
  }
}

// Expansion questions: frequency and company tags are derived deterministically from the id and topic.
for (const [topic, rows] of Object.entries(extraGroups)) {
  for (const [id, title, difficulty] of rows) {
    const letters = TOPIC_CODES[topic];
    const kept = [...letters].filter(c => fnv(id + c) < 0.7);
    const codes = kept.length ? kept : [letters[Math.floor(fnv(id) * letters.length)]];
    raw.push({ id, title, topic, difficulty, frequency: Math.round(42 + fnv(id + 'f') * 38), time: DEFAULT_TIME[difficulty], companies: codes.map(c => CODES[c]), url: `https://leetcode.com/problems/${id}/` });
  }
}
for (const [topic, ids] of Object.entries(MOVES)) {
  for (const p of raw) if (ids.includes(p.id)) p.topic = topic;
}

// The biggest companies would otherwise be tagged on almost everything; thin out the lower-frequency ones.
for (const big of ['Amazon', 'Meta', 'Google', 'Microsoft']) {
  for (const p of raw) {
    if (p.frequency < 75 && p.companies.length > 1 && fnv(p.id + big) < 0.5) p.companies = p.companies.filter(c => c !== big);
  }
}

// Top up the hand-tagged companies that would otherwise have very short queues.
const topUp = { Apple: 24, Adobe: 22, Netflix: 14, Uber: 24 };
const allProfiles = [...coreInfo.filter(c => topUp[c.name]).map(c => ({ name: c.name, focus: c.focus, size: topUp[c.name] })), ...profiles];

for (const profile of allProfiles) {
  const tagged = raw.filter(p => p.companies.includes(profile.name)).length;
  const need = profile.size - tagged;
  if (need <= 0) continue;
  const bias = { Easy: profile.easyBias ? 1.3 : profile.hardBias ? 0.6 : 1, Medium: 1, Hard: profile.easyBias ? 0.5 : profile.hardBias ? 1.3 : 1 };
  raw
    .filter(p => !p.companies.includes(profile.name))
    .map(p => ({ p, score: (0.45 * (p.frequency / 100) + (profile.focus.includes(p.topic) ? 0.35 : 0) + 0.2 * fnv(profile.name + p.id)) * bias[p.difficulty] }))
    .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id))
    .slice(0, need)
    .forEach(({ p }) => p.companies.push(profile.name));
}

// Every question should belong to at least one company.
const everyone = [...coreInfo, ...profiles].map(c => c.name);
for (const p of raw) {
  if (!p.companies.length) p.companies.push(everyone[Math.floor(fnv(p.id) * everyone.length)]);
}

export const problems = raw.map(normalizeProblem);

// Topic order doubles as the roadmap order.
export const roadmapTopics = [
  { name: 'Arrays & Hashing', concepts: ['Hash maps and sets', 'Frequency counting', 'Prefix sums', 'In-place array tricks'] },
  { name: 'Strings', concepts: ['Parsing and simulation', 'Palindromes', 'Character counting', 'Building results with a buffer'] },
  { name: 'Two Pointers', concepts: ['Opposite-end pointers', 'Pair search in sorted arrays', 'Skipping duplicates while scanning', 'In-place partitioning'] },
  { name: 'Sliding Window', concepts: ['Fixed-size windows', 'Variable-size windows', 'Counting inside a window', 'Monotonic deque'] },
  { name: 'Stack', concepts: ['Matching brackets', 'Monotonic stack', 'Expression evaluation', 'Stacks with extra state'] },
  { name: 'Binary Search', concepts: ['Search on sorted arrays', 'Rotated arrays', 'Search on the answer', 'Boundary conditions'] },
  { name: 'Linked List', concepts: ['Reversal', 'Fast and slow pointers', 'Dummy head node', 'Merging lists'] },
  { name: 'Sorting', concepts: ['Custom comparators', 'Sort then scan', 'Counting and bucket sort', 'Merge sort ideas'] },
  { name: 'Trees', concepts: ['DFS recursion', 'BFS level order', 'BST properties', 'Lowest common ancestor', 'Serialization'] },
  { name: 'Tries', concepts: ['Prefix trees', 'Wildcard search', 'Trie plus DFS on a grid', 'Bitwise tries'] },
  { name: 'Heap', concepts: ['Top-K patterns', 'Two-heap median', 'Scheduling with a priority queue', 'Merging sorted streams'] },
  { name: 'Intervals', concepts: ['Sorting by start time', 'Merging overlaps', 'Greedy interval selection', 'Sweep line'] },
  { name: 'Greedy', concepts: ['Local choice, global proof', 'Sorting then scanning', 'Jump and reach problems', 'Exchange arguments'] },
  { name: 'Divide & Conquer', concepts: ['Split, solve, merge', 'Merge sort counting tricks', 'Recursion on halves', 'Skyline and range problems'] },
  { name: 'Matrix', concepts: ['Grid traversal and rotation', 'Spiral and diagonal walks', 'In-place updates', 'Prefix sums on grids'] },
  { name: 'Backtracking', concepts: ['Choose, explore, undo', 'Pruning', 'Subsets and permutations', 'Grid search'] },
  { name: 'Graphs', concepts: ['BFS and DFS on grids', 'Topological sort', 'Cycle detection', 'Bipartite checks'] },
  { name: 'Union Find', concepts: ['Disjoint sets with path compression', 'Connected components', 'Grouping by equivalence', 'Kruskal-style merging'] },
  { name: 'Advanced Graphs', concepts: ['Dijkstra', 'Bellman-Ford and bounded stops', 'Minimum spanning trees', 'Bridges and state-space BFS'] },
  { name: 'Dynamic Programming', concepts: ['1D state', '2D grids', 'Knapsack variants', 'Subsequences', 'Memoization vs tabulation'] },
  { name: 'Math & Bit Manipulation', concepts: ['Bit tricks (XOR, masks, shifts)', 'Number properties', 'Digit-by-digit arithmetic', 'Sieve and primes'] },
  { name: 'Design', concepts: ['Hash map + linked list', 'Randomized sets', 'Cache eviction policies', 'Implementing one structure with another'] }
];

// General, hedged guidance. Real loops change by role, team, and year.
export const companyInfo = [
  ...coreInfo,
  ...profiles.map(({ name, category, blurb, focus }) => ({ name, category, blurb, rounds: ROUNDS[category], focus }))
];
