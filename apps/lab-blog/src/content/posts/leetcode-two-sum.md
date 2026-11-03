---
title: "LeetCode 1. 两数之和"
pubDatetime: 2026-11-01T19:00:00+08:00
featured: false
draft: false
tags:
  - LeetCode
  - 算法
  - TypeScript
  - 哈希表
description: "题解"
---

## 题目

给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出**和为目标值** `target` 的那**两个**整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。

你可以按任意顺序返回答案。

**示例 1：**

```text
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9，返回 [0, 1]。
```

**示例 2：**

```text
输入：nums = [3,2,4], target = 6
输出：[1,2]
```

**示例 3：**

```text
输入：nums = [3,3], target = 6
输出：[0,1]
```

**提示：**

- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i] <= 10^9`
- `-10^9 <= target <= 10^9`
- **只会存在一个有效答案**

## 目录

## 一、暴力解法：枚举所有数对

这是我直接想到的方法：

```ts
function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
```

但他的时间复杂度是 $O(n^2)$，当数组长度来到 $10^4$ 量级时，显然不是聪明的做法，那如何降低时间复杂度？

## 二、哈希表解法

但是，我们可以使用哈希表来存储已经访问过的数字，因为哈希表访问的耗时是 $O(1)$，这样就可以减少一次循环遍历。

```ts
class Solution {
  twoSum(nums: number[], target: number): number[] {
    // key: 已经遍历过的数值；value: 它对应的下标
    const seen = new Map<number, number>();

    for (let i = 0; i < nums.length; i++) {
      const need = target - nums[i];
      const j = seen.get(need);

      if (j !== undefined) {
        return [j, i];
      }

      seen.set(nums[i], i);
    }

    return [];
  }
}
```

遍历到 `nums[i]` 时，哈希表里存的全是 `i` 之前的元素，所以返回的两个下标一定不同，也就不会把同一个元素用两次。这样，这个问题的时间复杂度就来到了 $O(n)$。
