package com.clopez.lgram.datamodel;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.cloud.gcp.data.datastore.core.mapping.Entity;
import org.springframework.data.annotation.Id;


@Entity
public class Event {

	@Id
	private String id;
	
	private String creatorId;
	private String creatorMail;
	private String creatorName;
	private Date createdAt;
	private Date lastSeen;
	private int numberAccess;
	private String text;
	private String multiMedia; //URL to storage picture or video
	private String location; // To be Implemented (location of the event)
	private Set<String> likes; //ArrayList to user id's
	private Set<String> dislikes; // ArrayList to user id's
	
	public Event(String creatorId, String text, String multiMedia) {
		this.id = UUID.randomUUID().toString();
		this.creatorId = creatorId;
		this.creatorMail = "";
		this.creatorName = "";
		this.text = text;
		this.multiMedia = multiMedia;
		this.location = "";
		this.createdAt = new Date();
		this.lastSeen = this.createdAt;
		this.numberAccess = 0;
		this.likes = new HashSet<String>();
		this.dislikes = new HashSet<String>();
		
	}

	public String getId() {
		return id;
	}

	public String getCreatorId() {
		return creatorId;
	}

	public void setCreatorMail(String mail) {
		this.creatorMail = mail;
	}
	
	public String getCreatorMail() {
		return creatorMail;
	}
	
	public void setCreatorName(String name) {
		this.creatorName = name;
	}
	
	public String getCreatorName() {
		return creatorName;
	}
	
	public Date getCreatedAt() {
		return createdAt;
	}

	public Date getLastSeen() {
		return lastSeen;
	}

	public void setLastSeen(Date lastSeen) {
		this.lastSeen = lastSeen;
	}

	public int getNumberAccess() {
		return numberAccess;
	}

	public void setNumberAccess(int numberAccess) {
		this.numberAccess = numberAccess;
	}

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public String getMultiMedia() {
		return multiMedia;
	}

	public void setMultiMedia(String multiMedia) {
		this.multiMedia = multiMedia;
	}

	public Set<String> getLikes() {
		return likes;
	}


	public Set<String> getDislikes() {
		return dislikes;
	}
	
	public int getNumLikes() {
		return likes.size();
	}
	
	public int getNumDislikes() {
		return dislikes.size();
	}
	
	public boolean addLike(String id) {
		return likes.add(id);
	}
	
	public boolean addDislike(String id) {
		return dislikes.add(id);
	}
}
