package com.clopez.lgram.datamodel;

import java.util.Date;
import java.util.Set;

public class UserPublic {

	public String name;
	public String email;
	private String avatar; //URL to avatar pictute
	private int numPosts;
	private Date userSince;
	private Date lastPost;
	private int numFollowers;
	
	public UserPublic(User u) {
		this.name = u.getName();
		this.email = u.getEmail();
		this.avatar = u.getAvatar();
		this.numPosts = u.getNumPosts();
		this.userSince = u.getUserSince();
		this.lastPost = u.getLastPost();
		this.numFollowers = u.getFollowers().size();
	}

	public String getName() {
		return name;
	}

	public String getEmail() {
		return email;
	}

	public String getAvatar() {
		return avatar;
	}
	
	public Date getUserSince() {
		return userSince;
	}
	
	public int getNumPosts() {
		return numPosts;
	}
	
	public Date getLastPost() {
		return lastPost;
	}
	
	public int getNumFollowers() {
		return numFollowers;
	}

	public void removePersonalInfo() {
		this.email = "";
	}
	
	
}
