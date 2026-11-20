// Sum of the amounts of a given type ("income" / "expense").
export function sumByType(list, type) {
  return list.filter((item) => item.type === type).reduce((total, item) => total + item.amount, 0);
}

// Sum of the amounts of a given category, regardless of type.
export function sumByCategory(list, category) {
  return list.filter((item) => item.category === category).reduce((total, item) => total + item.amount, 0);
}

// { category: sum of expenses } – income is skipped.
export function spentByCategory(list) {
  return list
    .filter((item) => item.type === "expense")
    .reduce((groups, item) => {
      groups[item.category] = (groups[item.category] || 0) + item.amount;
      return groups;
    }, {});
}
