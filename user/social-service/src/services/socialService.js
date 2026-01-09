import * as repo from "../repositories/socialRepository.js"

export async function addFriend(userId, friendId) {
  if (userId === friendId) {
    throw new Error("Cannot add yourself as friend")
  }

  // Mutual friendship - parallel insert
  await Promise.all([
    repo.insertFriend(userId, friendId),
    repo.insertFriend(friendId, userId)
  ])

  // Fire and forget - don't wait for count recalculation
  Promise.all([
    repo.recalculateFriendCount(userId),
    repo.recalculateFriendCount(friendId)
  ]).catch(console.error)

  return { message: "Friend added" }
}

export async function removeFriend(userId, friendId) {
  await Promise.all([
    repo.deleteFriend(userId, friendId),
    repo.deleteFriend(friendId, userId)
  ])

  // Fire and forget - don't wait for count recalculation
  Promise.all([
    repo.recalculateFriendCount(userId),
    repo.recalculateFriendCount(friendId)
  ]).catch(console.error)

  return { message: "Friend removed" }
}

export async function fetchMyFriends(userId) {
  return repo.getFriends(userId)
}
