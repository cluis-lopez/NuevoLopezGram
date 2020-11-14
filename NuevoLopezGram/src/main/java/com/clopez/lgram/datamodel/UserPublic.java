package com.clopez.lgram.datamodel;

import java.util.Set;

public class UserPublic {

	public String name;
	public String email;
	private Set<String> friends;//List of friends uid's
	private String avatar; //URL to avatar pictute
	
	public UserPublic(User u) {
		this.name = u.getName();
		this.email = u.getEmail();
		this.friends = u.getFriends();
		this.avatar = u.getAvatar();
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
	
	
}
