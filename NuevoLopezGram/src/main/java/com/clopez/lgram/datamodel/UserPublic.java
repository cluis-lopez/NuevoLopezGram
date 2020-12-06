package com.clopez.lgram.datamodel;

import java.util.Date;
import java.util.Set;

public class UserPublic {

	public String name;
	public String email;
	private Set<String> friends;//List of friends uid's
	private String avatar; //URL to avatar pictute
	private int numPosts;
	private Date lastPost;
	
	public UserPublic(User u) {
		this.name = u.getName();
		this.email = u.getEmail();
		this.friends = u.getFriends();
		this.avatar = u.getAvatar();
		this.numPosts = u.getNumPosts();
		this.lastPost = u.getLastPost();
	}

	public String getName() {
		return name;
	}

	public String getEmail() {
		return email;
	}

	public Set<String> getFriends() {
		return friends;
	}

	public String getAvatar() {
		return avatar;
	}
	
	public int getNumPosts() {
		return numPosts;
	}
	
	public Date getLastPost() {
		return lastPost;
	}
	
	
}
